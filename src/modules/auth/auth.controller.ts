import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';


import {
  ChangePasswordDTO,
  LoginDto,
  RegisterDto,
  RequestResetPasswordDTO,
  ResetPasswordDTO,
  VerifyEmailDTO,
} from './auth.dto';
import { AuthService } from './auth.service';
import { Public } from 'src/core/security/decorators/public.decorator';
import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';




@Controller('auth')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Public()
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  async login(@Body() loginDto: LoginDto, @Req() req: AuthenticatedRequest) {
    return this.authService.login(loginDto, req);
  }

  @Post('verify-email')
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.verifyEmail(verifyEmailDto, req);
  }

  @Post('request-password-reset')
  async passwordResetRequest(
    @Body() resetPasswordDto: RequestResetPasswordDTO,
  ) {
    return this.authService.requestResetPassword(resetPasswordDto);
  }

  @Post('password-reset')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDTO) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.changePassword(changePasswordDto, req);
  }
}
