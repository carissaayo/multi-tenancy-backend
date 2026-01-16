import { EntitySchema } from 'typeorm';
export type MessageType = 'text' | 'system' | 'file';
export interface Message {
    id: string;
    channelId: string;
    memberId: string;
    content: string;
    type: MessageType;
    threadId: string | null;
    isEdited: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
export declare const MessageEntity: EntitySchema<Message>;
