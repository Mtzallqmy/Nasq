import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from './permission-catalog';

export const REQUIRED_PERMISSIONS_KEY = 'nasq_required_permissions';
export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
