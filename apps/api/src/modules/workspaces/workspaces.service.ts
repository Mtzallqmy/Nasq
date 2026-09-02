import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestMetadata } from '../auth/auth.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { PERMISSION_CATALOG } from './permission-catalog';

const DEFAULT_ROLES = [
  { key: 'owner', name: 'المالك', isSystem: true },
  { key: 'admin', name: 'مدير', isSystem: true },
  { key: 'member', name: 'عضو', isSystem: true },
  { key: 'guest', name: 'ضيف', isSystem: true },
] as const;

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listForUser(userId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { joinedAt: 'asc' },
      select: {
        id: true,
        joinedAt: true,
        workspace: true,
        roles: {
          select: { role: { select: { id: true, key: true, name: true } } },
        },
      },
    });
  }

  async create(userId: string, dto: CreateWorkspaceDto, metadata: RequestMetadata) {
    const timezone = dto.timezone?.trim() || 'Asia/Riyadh';
    this.assertTimeZone(timezone);

    const workspace = await this.prisma.$transaction(
      async (tx) => {
        const permissions = [];
        for (const key of PERMISSION_CATALOG) {
          permissions.push(
            await tx.permission.upsert({
              where: { key },
              update: {},
              create: { key },
            }),
          );
        }

        if (!permissions.length) {
          throw new ServiceUnavailableException('Permission catalog is empty');
        }

        const created = await tx.workspace.create({
          data: {
            name: dto.name.trim(),
            timezone,
            locale: 'ar',
            ownerUserId: userId,
          },
        });

        const member = await tx.workspaceMember.create({
          data: {
            workspaceId: created.id,
            userId,
            status: 'ACTIVE',
          },
        });

        const createdRoles: Record<string, { id: string }> = {};
        for (const role of DEFAULT_ROLES) {
          const createdRole = await tx.role.create({
            data: {
              workspaceId: created.id,
              key: role.key,
              name: role.name,
              isSystem: role.isSystem,
            },
            select: { id: true },
          });
          createdRoles[role.key] = createdRole;
        }

        const ownerRole = createdRoles.owner;
        if (!ownerRole) throw new Error('Owner role was not created');

        await tx.workspaceMemberRole.create({
          data: { workspaceMemberId: member.id, roleId: ownerRole.id, workspaceId: created.id },
        });

        await tx.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: ownerRole.id,
            permissionId: permission.id,
          })),
        });

        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await this.audit.record({
      workspaceId: workspace.id,
      actorUserId: userId,
      action: 'workspaces.create',
      entityType: 'workspace',
      entityId: workspace.id,
      after: { name: workspace.name, timezone: workspace.timezone, locale: workspace.locale },
      ...metadata,
    });

    return workspace;
  }

  listMembers(workspaceId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId, status: 'ACTIVE' },
      orderBy: { joinedAt: 'asc' },
      select: {
        id: true,
        status: true,
        joinedAt: true,
        user: { select: { id: true, displayName: true } },
        roles: { select: { role: { select: { id: true, key: true, name: true } } } },
      },
    });
  }

  listRoles(workspaceId: string) {
    return this.prisma.role.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        key: true,
        name: true,
        isSystem: true,
        permissions: { select: { permission: { select: { key: true } } } },
      },
    });
  }

  listPermissions() {
    return this.prisma.permission.findMany({ orderBy: { key: 'asc' } });
  }

  private assertTimeZone(timezone: string): void {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
    } catch {
      throw new BadRequestException({
        code: 'INVALID_TIMEZONE',
        message: 'المنطقة الزمنية غير صالحة',
      });
    }
  }
}
