import { EntitySchema } from 'typeorm';

export interface Message {
  id: string;
  channelId: string;
  memberId: string;
  content: string;
  threadId: string | null;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  },
  indices: [
    {
      name: 'idx_messages_channel',
      columns: ['channelId'],
    },
    {
      name: 'idx_messages_thread',
      columns: ['threadId'],
    },
    {
      name: 'idx_messages_created_at',
      columns: ['createdAt'],
    },
  ],
});
