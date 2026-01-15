import { EntitySchema } from 'typeorm';
export interface Reaction {
    id: string;
    messageId: string;
    memberId: string;
    emoji: string;
    createdAt: Date;
}
export declare const ReactionEntity: EntitySchema<Reaction>;
