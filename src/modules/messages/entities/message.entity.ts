import { EntitySchema } from 'typeorm';

export type MessageType = 'text' | 'system' | 'file';

export interface Message {
  id: string;
  channelId: string;
  memberId: string;

  content: string;
  type: MessageType;

  threadId: string | null;

  isEdited: boolean;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const MessageEntity = new EntitySchema<Message>({
  name: 'Message',
  tableName: 'messages',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    channelId: {
      type: 'uuid',
      name: 'channel_id',
    },
    memberId: {
      type: 'uuid',
      name: 'member_id',
    },
    content: {
      type: 'text',
    },
    type: {
      type: 'varchar',
      length: 20,
      default: 'text',
    },
    threadId: {
      type: 'uuid',
      nullable: true,
      name: 'thread_id',
    },
    isEdited: {
      type: 'boolean',
      default: false,
      name: 'is_edited',
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
    deletedAt: {
      type: 'timestamp',
      nullable: true,
      name: 'deleted_at',
    },
  },
  indices: [
    {
      name: 'idx_messages_channel_created',
      columns: ['channelId', 'createdAt'],
    },
    {
      name: 'idx_messages_thread',
      columns: ['threadId'],
    },
  ],
});
