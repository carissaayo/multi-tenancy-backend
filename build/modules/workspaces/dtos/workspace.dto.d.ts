import { WorkspacePlan } from '../interfaces/workspace.interface';
export declare class CreateWorkspaceDto {
    name: string;
    slug: string;
    plan: WorkspacePlan;
    description: string;
    logo?: any;
}
export declare class UpdateWorkspaceDto {
    name: string;
    plan: WorkspacePlan;
    description: string;
    logoUrl: string;
}
