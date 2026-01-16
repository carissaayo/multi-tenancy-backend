import { WorkspaceInviteService } from '../services/workspace-invite.service';
import { WorkspaceInviteDto } from '../dtos/workspace-invite.dto';
import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
export declare class WorkspaceInviteController {
    private readonly workspaceService;
    constructor(workspaceService: WorkspaceInviteService);
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
