import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PermissionsGuard } from './permissions.guard';
import { WorkspaceContextGuard } from './workspace-context.guard';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [AuthModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceContextGuard, PermissionsGuard],
})
export class WorkspacesModule {}
