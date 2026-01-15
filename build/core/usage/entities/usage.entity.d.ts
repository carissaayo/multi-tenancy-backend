import { Workspace } from '../../../modules/workspaces/entities/workspace.entity';
export declare class UsageMetric {
    id: string;
    workspaceId: string;
    workspace: Workspace;
    metricType: string;
    value: number;
    period: string;
    createdAt: Date;
}
