"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceMemberEntity = void 0;
const typeorm_1 = require("typeorm");
exports.WorkspaceMemberEntity = new typeorm_1.EntitySchema({
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
        permissions: {
            type: 'jsonb',
            default: () => "'[]'::jsonb",
        },
    },
    indices: [
        {
            name: 'idx_members_user_id',
            columns: ['userId'],
        },
    ],
});
//# sourceMappingURL=member.entity.js.map