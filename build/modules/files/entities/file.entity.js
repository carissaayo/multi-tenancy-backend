"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileEntity = void 0;
const typeorm_1 = require("typeorm");
exports.FileEntity = new typeorm_1.EntitySchema({
    name: 'File',
    tableName: 'files',
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
        fileName: {
            type: 'varchar',
            length: 255,
            name: 'file_name',
        },
        fileSize: {
            type: 'bigint',
            name: 'file_size',
        },
        mimeType: {
            type: 'varchar',
            length: 100,
            nullable: true,
            name: 'mime_type',
        },
        storageKey: {
            type: 'varchar',
            length: 500,
            name: 'storage_key',
        },
        createdAt: {
            type: 'timestamp',
            default: () => 'NOW()',
            name: 'created_at',
        },
    },
    indices: [
        {
            name: 'idx_files_channel',
            columns: ['channelId'],
        },
    ],
});
//# sourceMappingURL=file.entity.js.map