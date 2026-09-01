import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface AuditEvent {
  workspaceId?: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(event: AuditEvent): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: event.action,
        entityType: event.entityType,
        ...(event.workspaceId ? { workspaceId: event.workspaceId } : {}),
        ...(event.actorUserId ? { actorUserId: event.actorUserId } : {}),
        ...(event.entityId ? { entityId: event.entityId } : {}),
        ...(event.requestId ? { requestId: event.requestId } : {}),
        ...(event.ipAddress ? { ipAddress: event.ipAddress } : {}),
        ...(event.userAgent ? { userAgent: event.userAgent } : {}),
        ...(event.before !== undefined ? { before: event.before } : {}),
        ...(event.after !== undefined ? { after: event.after } : {}),
        ...(event.metadata !== undefined ? { metadata: event.metadata } : {}),
      },
    });
  }
}
