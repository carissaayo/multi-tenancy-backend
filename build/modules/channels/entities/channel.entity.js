"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelEntity = void 0;
const typeorm_1 = require("typeorm");
exports.ChannelEntity = new typeorm_1.EntitySchema({
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
//# sourceMappingURL=channel.entity.js.map