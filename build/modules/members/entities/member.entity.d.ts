import { EntitySchema } from 'typeorm';
export interface WorkspaceMember {
    id: string;
    userId: string;
    role: 'owner' | 'admin' | 'member' | 'guest';
    isActive: boolean;
    permissions: string[];
    joinedAt: Date;
}
export declare const WorkspaceMemberEntity: EntitySchema<WorkspaceMember>;
