import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WorkspaceContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException({
        code: 'USER_CONTEXT_MISSING',
        message: 'هوية المستخدم غير متاحة',
      });
    }

    const workspaceId = request.header('x-workspace-id');
    if (!workspaceId) {
      throw new BadRequestException({
        code: 'WORKSPACE_CONTEXT_REQUIRED',
        message: 'يلزم تحديد مساحة العمل في x-workspace-id',
      });
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
      include: {
        workspace: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
        permissionOverrides: { include: { permission: true } },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenException({
        code: 'WORKSPACE_ACCESS_DENIED',
        message: 'لا تملك وصولًا إلى مساحة العمل المطلوبة',
      });
    }

    const permissionKeys = new Set<string>();
    for (const assignment of membership.roles) {
      for (const rolePermission of assignment.role.permissions) {
        permissionKeys.add(rolePermission.permission.key);
      }
    }
    for (const override of membership.permissionOverrides) {
      if (override.effect === 'ALLOW') permissionKeys.add(override.permission.key);
      if (override.effect === 'DENY') permissionKeys.delete(override.permission.key);
    }

    request.workspace = membership.workspace;
    request.workspaceMember = membership;
    request.permissionKeys = permissionKeys;
    return true;
  }
}
