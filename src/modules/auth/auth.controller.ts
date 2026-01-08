import {
  Controller,
  Post,
  Body,
  Req,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import {
  ChangePasswordDTO,
  LoginDto,
  RegisterDto,
  RequestResetPasswordDTO,
  ResetPasswordDTO,
  SelectWorkspaceDTO,
  VerifyEmailDTO,
} from './auth.dto';
import { AuthService } from './auth.service';
import { Public } from 'src/core/security/decorators/public.decorator';
import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';

@ApiTags('Authentication')
@Controller('auth')

export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  login(@Body() loginDto: LoginDto, @Req() req: AuthenticatedRequest) {
    return this.authService.login(loginDto, req);
  }

  @Post('verify-email')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Verify user email' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.verifyEmail(verifyEmailDto, req);
  }

  @Post('request-password-reset')
  @Public()
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  passwordResetRequest(@Body() resetPasswordDto: RequestResetPasswordDTO) {
    return this.authService.requestResetPassword(resetPasswordDto);
  }

  @Post('password-reset')
  @Public()
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDTO) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  changePassword(
    @Body() changePasswordDto: ChangePasswordDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.changePassword(changePasswordDto, req);
  }

  @Post('select-workspace')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Select workspace' })
  @ApiResponse({ status: 200, description: 'Workspace selected successfully' })
  selectWorkspace(
    @Body() selectWorkspaceDto: SelectWorkspaceDTO, @Req() req: AuthenticatedRequest) {
    return this.authService.selectWorkspace(selectWorkspaceDto, req);
  }
}
