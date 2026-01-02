import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';

import {
  ChangePasswordDTO,
  LoginDto,
  RegisterDto,
  RequestResetPasswordDTO,
  ResetPasswordDTO,
  VerifyEmailDTO,
} from './auth.dto';
import { RolesGuard } from '../../common/guards/role.guard';
import { CustomRequest } from 'src/utils/auth-utils';
import {
  AuthenticateTokenUserGuard,
  ReIssueTokenUserGuard,
} from '../../common/guards/user-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
@UseGuards(RolesGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Public()
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  async login(@Body() loginDto: LoginDto, @Req() req: CustomRequest) {
    return this.authService.login(loginDto, req);
  }

  @Post('verify-email')
  @UseGuards(AuthenticateTokenUserGuard, ReIssueTokenUserGuard)
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDTO,
    @Req() req: CustomRequest,
  ) {
    return this.authService.verifyEmail(verifyEmailDto, req);
  }

  @Post('request-password-reset')
  @UseGuards(AuthenticateTokenUserGuard, ReIssueTokenUserGuard)
  async passwordResetRequest(
    @Body() resetPasswordDto: RequestResetPasswordDTO,
  ) {
    return this.authService.requestResetPassword(resetPasswordDto);
  }

  @Post('password-reset')
  @UseGuards(AuthenticateTokenUserGuard, ReIssueTokenUserGuard)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDTO) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  @UseGuards(AuthenticateTokenUserGuard, ReIssueTokenUserGuard)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDTO,
    @Req() req: CustomRequest,
  ) {
    return this.authService.changePassword(changePasswordDto, req);
  }
}
