import { User } from '../../users/entities/user.entity';
import { WorkspaceInvitationStatus } from '../../workspaces/interfaces/workspace.interface';
export declare class ChannelInvitation {
    id: string;
    channelId: string;
    workspaceId: string;
    memberId: string;
    token: string;
    invitedBy: string | null;
    inviter: User | null;
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
