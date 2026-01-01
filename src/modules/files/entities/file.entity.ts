import { EntitySchema } from 'typeorm';

export interface File {
  id: string;
  channelId: string;
  memberId: string;
  fileName: string;
  fileSize: number;
  mimeType: string | null;
  storageKey: string;
  createdAt: Date;
}

export const FileEntity = new EntitySchema<File>({
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
