import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { getRuntimeConfig } from '../../config/env';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

const REFRESH_COOKIE = 'nasq_refresh';

function requestMetadata(req: Request) {
  const userAgent = req.header('user-agent');
  return {
    requestId: req.requestId,
    ...(req.ip ? { ipAddress: req.ip } : {}),
    ...(userAgent ? { userAgent } : {}),
  };
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.header('cookie');
  if (!header) return undefined;
  const prefix = `${name}=`;
  const item = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : undefined;
}

function setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: getRuntimeConfig().authCookieSecure,
    sameSite: 'lax',
    path: '/api/v1/auth',
    expires: expiresAt,
  });
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Create a user account and session' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.register(dto, requestMetadata(req));
    setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    const { refreshToken: _refreshToken, ...publicResult } = result;
    return publicResult;
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate and create a device session' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto, requestMetadata(req));
    setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    const { refreshToken: _refreshToken, ...publicResult } = result;
    return publicResult;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token and issue a new access token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = readCookie(req, REFRESH_COOKIE);
    if (!token) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_REQUIRED',
        message: 'رمز تحديث الجلسة مطلوب',
      });
    }
    const result = await this.auth.refresh(token, requestMetadata(req));
    setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    const { refreshToken: _refreshToken, ...publicResult } = result;
    return publicResult;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the current session' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.user!.id, req.user!.sessionId, requestMetadata(req));
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
    return { success: true };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active device sessions' })
  sessions(@Req() req: Request) {
    return this.auth.listSessions(req.user!.id, req.user!.sessionId);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke one device session' })
  async revoke(@Param('sessionId') sessionId: string, @Req() req: Request) {
    await this.auth.revokeSession(req.user!.id, sessionId, requestMetadata(req));
    return { success: true };
  }
}
