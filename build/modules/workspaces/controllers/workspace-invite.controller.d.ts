import { WorkspaceInviteService } from '../services/workspace-invite.service';
import { WorkspaceInviteDto } from '../dtos/workspace-invite.dto';
import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
export declare class WorkspaceInviteController {
    private readonly workspaceService;
    constructor(workspaceService: WorkspaceInviteService);
    getMyInvitations(req: AuthenticatedRequest): Promise<{
        invitations: {
            id: string;
            token: string;
            email: string;
            role: import("../interfaces/workspace.interface").WorkspaceInvitationRole;
            status: import("../interfaces/workspace.interface").WorkspaceInvitationStatus;
            invitedAt: Date;
            expiresAt: Date;
            workspace: {
                id: string;
                name: string;
                slug: string;
                logoUrl: string;
            } | null;
            invitedBy: {
                id: string;
                email: string;
                fullName: string | null;
                avatarUrl: string | null;
            } | null;
        }[];
        total: number;
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    getInvitations(req: AuthenticatedRequest): Promise<{
        invitations: {
            id: string;
            email: string;
            role: import("../interfaces/workspace.interface").WorkspaceInvitationRole;
            status: import("../interfaces/workspace.interface").WorkspaceInvitationStatus;
            invitedAt: Date;
            expiresAt: Date;
            acceptedAt: Date | null;
            revokedAt: Date | null;
            invitedBy: {
                id: string;
                email: string;
                fullName: string | null;
                avatarUrl: string | null;
            } | null;
            sentTo: {
                id: string;
                email: string;
                fullName: string | null;
                avatarUrl: string | null;
            } | null;
            revokedBy: {
                id: string;
                email: string;
                fullName: string | null;
                avatarUrl: string | null;
            } | null;
        }[];
        total: number;
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    sendInvitation(req: AuthenticatedRequest, inviteDto: WorkspaceInviteDto): Promise<{
        message: string;
        invitationId: string;
        token: string;
        accessToken: string;
        refreshToken: string;
    }>;
    revokeInvitation(req: AuthenticatedRequest, inviteId: string): Promise<import("../interfaces/workspace.interface").NoDataWorkspaceResponse>;
    acceptInvitation(token: string): Promise<{
        message: string;
        workspace: import("../entities/workspace.entity").Workspace;
    }>;
}
