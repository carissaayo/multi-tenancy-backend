import { EntitySchema } from 'typeorm';
export interface Channel {
    id: string;
    name: string;
    description: string | null;
    isPrivate: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ChannelEntity: EntitySchema<Channel>;
