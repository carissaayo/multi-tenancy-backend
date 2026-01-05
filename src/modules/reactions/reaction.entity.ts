import { EntitySchema } from 'typeorm';

export interface Reaction {
  id: string;
  messageId: string;
  memberId: string;
  emoji: string;
  createdAt: Date;
}

export const ReactionEntity = new EntitySchema<Reaction>({
  name: 'Reaction',
  tableName: 'reactions',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    messageId: {
      type: 'uuid',
      name: 'message_id',
    },
    memberId: {
      type: 'uuid',
      name: 'member_id',
    },
    emoji: {
      type: 'varchar',
      length: 50,
    },
    createdAt: {
      type: 'timestamp',
      default: () => 'NOW()',
      name: 'created_at',
    },
  },
  uniques: [
    {
      name: 'unique_message_member_emoji',
      columns: ['messageId', 'memberId', 'emoji'],
    },
  ],
  indices: [
    {
      name: 'idx_reactions_message',
      columns: ['messageId'],
    },
  ],
});
