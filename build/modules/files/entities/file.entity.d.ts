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
export declare const FileEntity: EntitySchema<File>;
