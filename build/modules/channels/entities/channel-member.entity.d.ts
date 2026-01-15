import { EntitySchema } from 'typeorm';
export interface ChannelMember {
    id: string;
    channelId: string;
    memberId: string;
    joinedAt: Date;
}
export declare const ChannelMemberEntity: EntitySchema<ChannelMember>;
