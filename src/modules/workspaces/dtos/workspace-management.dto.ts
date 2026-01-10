import { IsNotEmpty, IsString } from "class-validator";
import { WorkspaceInvitationRole } from "../interfaces/workspace.interface";

export class ChangeMemberRoleDto {
  @IsString()
  @IsNotEmpty()
  targetUserId: string;

  @IsString()
  @IsNotEmpty()
  newRole: WorkspaceInvitationRole;
}       