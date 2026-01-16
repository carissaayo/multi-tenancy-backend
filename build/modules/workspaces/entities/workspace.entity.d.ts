import { User } from '../../users/entities/user.entity';
import { WorkspacePlan } from '../interfaces/workspace.interface';
export declare class Workspace {
    id: string;
    slug: string;
    name: string;
    description: string;
    logoUrl: string;
    plan: WorkspacePlan;
    isActive: boolean;
    settings: Record<string, any>;
    createdBy: string;
    creator: User;
    ownerId: string;
    owner: User;
    sentToId: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
