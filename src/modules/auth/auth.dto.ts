import { IsNotEmpty, IsString, IsEmail, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MatchesProperty } from 'src/core/validators/matches-property';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty({ message: 'Full Name is required' })
  fullName!: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @IsNotEmpty({ message: 'Phone Number is required' })
  phoneNumber!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  @ApiProperty({ example: 'password123' })
  @MatchesProperty('password', { message: 'Passwords do not match' })
  @IsNotEmpty({ message: 'Please confirm your password' })
  confirmPassword!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsString()
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password: string;
}

export class VerifyEmailDTO {
  @ApiProperty({ example: '123456' })
  @IsNotEmpty({ message: 'Please enter the verification code' })
  emailCode!: string;
}

export class RequestResetPasswordDTO {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;
}

export class ResetPasswordDTO {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiProperty({ example: '654321' })
  @IsString()
  @IsNotEmpty({ message: 'Password Reset code is required' })
  passwordResetCode!: string;

  @ApiProperty({ example: 'newPassword123', minLength: 6 })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  newPassword!: string;

  @ApiProperty({ example: 'newPassword123' })
  @MatchesProperty('newPassword', { message: 'Passwords do not match' })
  @IsNotEmpty({ message: 'Please confirm your password' })
  confirmNewPassword!: string;
}

export class ChangePasswordDTO {
  @ApiProperty({ example: 'oldPassword123' })
  @IsNotEmpty({ message: 'Current password is required' })
  password!: string;

  @ApiProperty({ example: 'newPassword123', minLength: 6 })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty({ message: 'New password is required' })
  newPassword!: string;

  @ApiProperty({ example: 'newPassword123' })
  @MatchesProperty('newPassword', { message: 'Passwords do not match' })
  @IsNotEmpty({ message: 'Please confirm your new password' })
  confirmNewPassword!: string;
}

export class SelectWorkspaceDTO {
  @ApiProperty({
    example: '4872fe39-d206-4108-b705-77cff45ab63e',
    description: 'Valid UUID v4 format',
  })
  @IsUUID('4', { message: 'Workspace ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Workspace ID is required' })
  workspaceId!: string;
}