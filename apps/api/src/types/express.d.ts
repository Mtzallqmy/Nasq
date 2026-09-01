import type { Workspace, WorkspaceMember } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        id: string;
        email: string;
        sessionId: string;
      };
      workspace?: Workspace;
      workspaceMember?: WorkspaceMember;
      permissionKeys?: Set<string>;
    }
  }
}

export {};
