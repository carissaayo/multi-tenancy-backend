import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  @Length(20, 1000)
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}
