import { EntitySchema } from 'typeorm';

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ChannelEntity = new EntitySchema<Channel>({
  name: 'Channel',
  tableName: 'channels',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    name: {
      type: 'varchar',
      length: 100,
    },
    description: {
      type: 'text',
      nullable: true,
    },
    isPrivate: {
      type: 'boolean',
      default: false,
      name: 'is_private',
    },
    createdBy: {
      type: 'uuid',
      name: 'created_by',
    },
    createdAt: {
      type: 'timestamp',
      default: () => 'NOW()',
      name: 'created_at',
    },
    updatedAt: {
      type: 'timestamp',
      default: () => 'NOW()',
      name: 'updated_at',
    },
  },
  indices: [
    {
      name: 'idx_channels_name',
      columns: ['name'],
    },
  ],
});
