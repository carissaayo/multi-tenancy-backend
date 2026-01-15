import { IsNotEmpty, IsString } from "class-validator";

export class ChannelInviteDto{
    @IsString()
    @IsNotEmpty()
    memberId: string;
}