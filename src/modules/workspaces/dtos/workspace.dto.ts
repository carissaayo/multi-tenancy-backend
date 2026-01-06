import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { WorkspacePlan } from "../interfaces/workspace.interface";

export class CreateWorkspaceDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsEnum(WorkspacePlan)
    @IsNotEmpty()
    @IsOptional()
    plan: WorkspacePlan;

    @IsString()
    @IsOptional()
    description: string;
}
