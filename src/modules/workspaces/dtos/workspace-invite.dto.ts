import { IsNotEmpty, IsString } from "class-validator";

export class WorkspaceInviteDto {
  @IsString()
  @IsNotEmpty()
  email: string;
}   