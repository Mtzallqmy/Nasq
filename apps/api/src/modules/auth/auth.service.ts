import { createHash, randomBytes } from 'node:crypto';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import argon2 from 'argon2';
import { getRuntimeConfig } from '../../config/env';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface RequestMetadata {
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly audit: AuditService,
  ) {}

  async register(dto: RegisterDto, metadata: RequestMetadata) {
    const email = dto.email.trim().toLowerCase();
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          ...(dto.displayName?.trim() ? { displayName: dto.displayName.trim() } : {}),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'البريد الإلكتروني مستخدم بالفعل',
        });
      }
      throw error;
    }

    const tokens = await this.createSession(user.id, user.email, metadata);
    await this.audit.record({
      actorUserId: user.id,
      action: 'auth.register',
      entityType: 'user',
      entityId: user.id,
      ...metadata,
    });

    return {
      user: this.publicUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto, metadata: RequestMetadata) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'بيانات الدخول غير صحيحة',
      });
    }

    const tokens = await this.createSession(user.id, user.email, metadata);
    await this.audit.record({
      actorUserId: user.id,
      action: 'auth.login',
      entityType: 'session',
      entityId: tokens.sessionId,
      ...metadata,
    });

    return {
      user: this.publicUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string, metadata: RequestMetadata) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: tokenHash },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'جلسة التحديث غير صالحة أو منتهية',
      });
    }

    const nextRefreshToken = this.generateRefreshToken();
    const nextHash = this.hashRefreshToken(nextRefreshToken);
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: nextHash,
        lastUsedAt: new Date(),
        ...(metadata.ipAddress ? { ipAddress: metadata.ipAddress } : {}),
        ...(metadata.userAgent ? { userAgent: metadata.userAgent } : {}),
      },
    });

    const accessToken = await this.signAccessToken(session.user.id, session.user.email, session.id);
    await this.audit.record({
      actorUserId: session.user.id,
      action: 'auth.refresh',
      entityType: 'session',
      entityId: session.id,
      ...metadata,
    });

    return {
      sessionId: session.id,
      accessToken,
      refreshToken: nextRefreshToken,
      accessTokenExpiresIn: getRuntimeConfig().jwtAccessTtlSeconds,
      refreshTokenExpiresAt: session.expiresAt,
    };
  }

  async logout(userId: string, sessionId: string, metadata: RequestMetadata): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.audit.record({
      actorUserId: userId,
      action: 'auth.logout',
      entityType: 'session',
      entityId: sessionId,
      ...metadata,
    });
  }

  async listSessions(userId: string, currentSessionId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
    });

    return sessions.map((session) => ({
      ...session,
      current: session.id === currentSessionId,
    }));
  }

  async revokeSession(userId: string, sessionId: string, metadata: RequestMetadata): Promise<void> {
    const result = await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (result.count > 0) {
      await this.audit.record({
        actorUserId: userId,
        action: 'auth.session.revoke',
        entityType: 'session',
        entityId: sessionId,
        ...metadata,
      });
    }
  }

  private async createSession(userId: string, email: string, metadata: RequestMetadata) {
    const config = getRuntimeConfig();
    const refreshToken = this.generateRefreshToken();
    const expiresAt = new Date(Date.now() + config.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: this.hashRefreshToken(refreshToken),
        expiresAt,
        ...(metadata.ipAddress ? { ipAddress: metadata.ipAddress } : {}),
        ...(metadata.userAgent ? { userAgent: metadata.userAgent } : {}),
      },
    });

    return {
      sessionId: session.id,
      accessToken: await this.signAccessToken(userId, email, session.id),
      refreshToken,
      accessTokenExpiresIn: config.jwtAccessTtlSeconds,
      refreshTokenExpiresAt: expiresAt,
    };
  }

  private async signAccessToken(userId: string, email: string, sessionId: string): Promise<string> {
    const config = getRuntimeConfig();
    return this.jwtService.signAsync(
      { sub: userId, sid: sessionId, email, type: 'access' },
      { secret: config.jwtAccessSecret, expiresIn: config.jwtAccessTtlSeconds },
    );
  }

  private generateRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private publicUser(user: { id: string; email: string; displayName: string | null; locale: string; timezone: string; createdAt: Date }) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      locale: user.locale,
      timezone: user.timezone,
      createdAt: user.createdAt,
    };
  }
}
