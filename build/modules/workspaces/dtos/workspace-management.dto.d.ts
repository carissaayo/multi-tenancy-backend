import { WorkspaceInvitationRole } from '../interfaces/workspace.interface';
export declare class ChangeMemberRoleDto {
    targetUserId: string;
    newRole: WorkspaceInvitationRole;
}
export declare class RemoveUserFromWorkspaceDto {
    targetUserId: string;
}
export declare class DeactivateMemberDto {
    targetUserId: string;
}
export declare class TransferOwnershipDto {
    targetUserId: string;
}
