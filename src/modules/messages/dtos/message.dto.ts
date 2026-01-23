import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export  class GetMessagesDto {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    channelId!: string;
}

export  class UpdateMessageDto {
    @IsString()
    @IsNotEmpty()
    newContent!: string;
}