import { IsEnum, IsNotEmpty, IsOptional, IsString, Allow } from 'class-validator';
import { WorkspacePlan } from '../interfaces/workspace.interface';

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

  @Allow()
  @IsOptional()
  logo?: any; // File will be handled by FileInterceptor
}

export class UpdateWorkspaceDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsEnum(WorkspacePlan)
  @IsOptional()
  plan: WorkspacePlan;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  logoUrl: string;
}