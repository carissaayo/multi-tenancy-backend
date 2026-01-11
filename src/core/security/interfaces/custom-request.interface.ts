
import type { Request } from 'express';
import { WorkspaceMember } from 'src/modules/members/entities/member.entity';
import { User } from 'src/modules/users/entities/user.entity';

import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';

export interface AuthenticatedRequest extends Request {
  verifyAccessToken?: 'nil' | 'failed' | 'success';
  verifyAccessTokenMessage?: string | undefined;
  userId: string;
  token?: string;
  files?: any;

  // Workspace-related properties
  user?: User; // Authenticated user
  workspace?: Workspace; // Current workspace context
  workspaceMember?: WorkspaceMember; // User's membership in this workspace
  workspaceMemberRole?: string; // Role of user in this workspace
  workspaceId?: string;
}

