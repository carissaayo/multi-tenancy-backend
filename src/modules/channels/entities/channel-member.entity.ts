import { EntitySchema } from 'typeorm';

export interface ChannelMember {
  id: string;
  channelId: string;
  memberId: string;
  joinedAt: Date;
}

export const ChannelMemberEntity = new EntitySchema<ChannelMember>({
  name: 'ChannelMember',
  tableName: 'channel_members',
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
    joinedAt: {
      type: 'timestamp',
      default: () => 'NOW()',
      name: 'joined_at',
    },
  },
  uniques: [
    {
      name: 'unique_channel_member',
      columns: ['channelId', 'memberId'],
    },
  ],
  indices: [
    {
      name: 'idx_channel_members_channel',
      columns: ['channelId'],
    },
    {
      name: 'idx_channel_members_member',
      columns: ['memberId'],
    },
  ],
});
