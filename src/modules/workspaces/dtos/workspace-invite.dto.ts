import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { WorkspaceInvitationRole } from "../interfaces/workspace.interface";

export class WorkspaceInviteDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsEnum(WorkspaceInvitationRole)
  @IsNotEmpty()
  role: WorkspaceInvitationRole;
}   