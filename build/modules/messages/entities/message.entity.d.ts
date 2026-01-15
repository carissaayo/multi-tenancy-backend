import { EntitySchema } from 'typeorm';
export interface Message {
    id: string;
    channelId: string;
    memberId: string;
    content: string;
    threadId: string | null;
    isEdited: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const MessageEntity: EntitySchema<Message>;
