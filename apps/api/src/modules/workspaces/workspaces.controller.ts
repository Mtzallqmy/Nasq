import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { PermissionsGuard } from './permissions.guard';
import { RequirePermissions } from './require-permissions.decorator';
import { WorkspaceContextGuard } from './workspace-context.guard';
import { WorkspacesService } from './workspaces.service';

function metadata(req: Request) {
  const userAgent = req.header('user-agent');
  return {
    requestId: req.requestId,
    ...(req.ip ? { ipAddress: req.ip } : {}),
    ...(userAgent ? { userAgent } : {}),
  };
}

@ApiTags('workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Get()
  @ApiOperation({ summary: 'List workspaces available to the authenticated user' })
  list(@Req() req: Request) {
    return this.workspaces.listForUser(req.user!.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a workspace and assign the creator as Owner' })
  create(@Req() req: Request, @Body() dto: CreateWorkspaceDto) {
    return this.workspaces.create(req.user!.id, dto, metadata(req));
  }

  @Get('current')
  @UseGuards(WorkspaceContextGuard, PermissionsGuard)
  @ApiHeader({ name: 'x-workspace-id', required: true })
  @ApiOperation({ summary: 'Get the selected workspace context' })
  current(@Req() req: Request) {
    return req.workspace;
  }

  @Get('current/members')
  @UseGuards(WorkspaceContextGuard, PermissionsGuard)
  @RequirePermissions('members.view')
  @ApiHeader({ name: 'x-workspace-id', required: true })
  @ApiOperation({ summary: 'List members in the selected workspace' })
  members(@Req() req: Request) {
    return this.workspaces.listMembers(req.workspace!.id);
  }

  @Get('current/roles')
  @UseGuards(WorkspaceContextGuard, PermissionsGuard)
  @RequirePermissions('roles.manage')
  @ApiHeader({ name: 'x-workspace-id', required: true })
  @ApiOperation({ summary: 'List roles in the selected workspace' })
  roles(@Req() req: Request) {
    return this.workspaces.listRoles(req.workspace!.id);
  }

  @Get('current/permissions')
  @UseGuards(WorkspaceContextGuard, PermissionsGuard)
  @RequirePermissions('roles.manage')
  @ApiHeader({ name: 'x-workspace-id', required: true })
  @ApiOperation({ summary: 'List the granular permission catalog' })
  permissions() {
    return this.workspaces.listPermissions();
  }
}
