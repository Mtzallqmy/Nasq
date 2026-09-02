import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PermissionKey } from './permission-catalog';
import { REQUIRED_PERMISSIONS_KEY } from './require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PermissionKey[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<Express.Request>();
    const granted = request.permissionKeys ?? new Set<string>();
    const missing = required.filter((permission) => !granted.has(permission));
    if (missing.length) {
      throw new ForbiddenException({
        code: 'PERMISSION_DENIED',
        message: 'ليست لديك الصلاحيات المطلوبة',
        details: { missing },
      });
    }
    return true;
  }
}
