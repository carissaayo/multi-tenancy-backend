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
    user?: User;
    workspace?: Workspace;
    workspaceMember?: WorkspaceMember;
    workspaceMemberRole?: string;
    workspaceId?: string;
}
