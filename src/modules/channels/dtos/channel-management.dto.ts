import { IsNotEmpty, IsString } from "class-validator";

export class RemoveMemberFromChannelDto {
    @IsString()
    @IsNotEmpty()
    targetMemberId: string;
}

export class AddMemberToChannelDto {
    @IsString()
    @IsNotEmpty()
    memberId: string;
}