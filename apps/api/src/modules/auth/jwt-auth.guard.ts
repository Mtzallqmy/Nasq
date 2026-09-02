import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { getRuntimeConfig } from '../../config/env';
import { PrismaService } from '../../database/prisma.service';

interface AccessTokenPayload {
  sub: string;
  sid: string;
  email: string;
  type: 'access';
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.header('authorization');

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException({ code: 'AUTH_REQUIRED', message: 'المصادقة مطلوبة' });
    }

    const token = authorization.slice('Bearer '.length).trim();
    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: getRuntimeConfig().jwtAccessSecret,
      });

      if (payload.type !== 'access' || !payload.sub || !payload.sid) {
        throw new Error('Invalid access token payload');
      }

      const session = await this.prisma.session.findFirst({
        where: {
          id: payload.sid,
          userId: payload.sub,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      });
      if (!session) throw new Error('Session is revoked or expired');

      request.user = {
        id: payload.sub,
        email: payload.email,
        sessionId: payload.sid,
      };
      return true;
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_ACCESS_TOKEN',
        message: 'رمز الوصول غير صالح أو الجلسة منتهية',
      });
    }
  }
}
