import { Workspace } from '../../../modules/workspaces/entities/workspace.entity';
export declare class FeatureFlag {
    id: string;
    workspaceId: string;
    workspace: Workspace;
    featureKey: string;
    isEnabled: boolean;
    metadata: Record<string, any>;
}
