import { EntitySchema } from 'typeorm';

export interface WorkspaceMember {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  isActive: boolean;
  joinedAt: Date;
}

export const WorkspaceMemberEntity = new EntitySchema<WorkspaceMember>({
  name: 'WorkspaceMember',
  tableName: 'members',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    userId: {
      type: 'uuid',
      name: 'user_id',
    },
    role: {
      type: 'varchar',
      length: 50,
    },
    isActive: {
      type: 'boolean',
      default: true,
      name: 'is_active',
    },
    joinedAt: {
      type: 'timestamp',
      default: () => 'NOW()',
      name: 'joined_at',
    },
  },
  indices: [
    {
      name: 'idx_members_user_id',
      columns: ['userId'],
    },
  ],
});
