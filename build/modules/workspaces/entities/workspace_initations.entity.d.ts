import { User } from '../../users/entities/user.entity';
import { Workspace } from '../entities/workspace.entity';
import { WorkspaceInvitationRole, WorkspaceInvitationStatus } from '../interfaces/workspace.interface';
export declare class WorkspaceInvitation {
    id: string;
    workspaceId: string;
    workspace: Workspace;
    email: string;
    role: WorkspaceInvitationRole;
    token: string;
    invitedBy: string | null;
    inviter: User | null;
    sentTo: User | null;
    sentToId: string | null;
    invitedAt: Date;
    expiresAt: Date;
    acceptedAt: Date | null;
    acceptedBy: string | null;
    acceptedByUser: User | null;
    revokedAt: Date | null;
    revokedBy: string | null;
    revokedByUser: User | null;
    status: WorkspaceInvitationStatus;
    message: string | null;
}
