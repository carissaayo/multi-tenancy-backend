import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { WorkspaceManagementService } from '../services/workspace-management.service';
import { ChangeMemberRoleDto, DeactivateMemberDto, RemoveUserFromWorkspaceDto, TransferOwnershipDto } from '../dtos/workspace-management.dto';
export declare class WorkspaceManagementController {
    private readonly workspaceManagementService;
    constructor(workspaceManagementService: WorkspaceManagementService);
    updateMemberRole(req: AuthenticatedRequest, changeMemberRoleDto: ChangeMemberRoleDto): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
        member: Partial<import("../../members/entities/member.entity").WorkspaceMember>;
    }>;
    removeUserFromWorkspace(req: AuthenticatedRequest, removeUserFromWorkspaceDto: RemoveUserFromWorkspaceDto): Promise<import("../interfaces/workspace.interface").NoDataWorkspaceResponse>;
    leaveWorkspace(req: AuthenticatedRequest): Promise<import("../interfaces/workspace.interface").NoDataWorkspaceResponse>;
    deactivateMember(req: AuthenticatedRequest, deactivateMemberDto: DeactivateMemberDto): Promise<import("../interfaces/workspace.interface").NoDataWorkspaceResponse>;
    transferOwnership(req: AuthenticatedRequest, transferOwnershipDto: TransferOwnershipDto): Promise<import("../interfaces/workspace.interface").NoDataWorkspaceResponse>;
}
