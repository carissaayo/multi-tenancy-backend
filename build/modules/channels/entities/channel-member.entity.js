"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelMemberEntity = void 0;
const typeorm_1 = require("typeorm");
exports.ChannelMemberEntity = new typeorm_1.EntitySchema({
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
//# sourceMappingURL=channel-member.entity.js.map