"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactionEntity = void 0;
const typeorm_1 = require("typeorm");
exports.ReactionEntity = new typeorm_1.EntitySchema({
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
//# sourceMappingURL=reaction.entity.js.map