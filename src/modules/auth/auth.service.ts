import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import bcrypt from 'bcryptjs';


import { User } from "../users/entities/user.entity";
import { TokenManager } from "src/core/security/services/token-manager.service";
import { ChangePasswordDTO, LoginDto, RegisterDto, RequestResetPasswordDTO, ResetPasswordDTO, VerifyEmailDTO } from "./auth.dto";
import { customError } from "src/core/error-handler/custom-errors";
import { generateOtp } from "src/utils/util";
import { AuthenticatedRequest } from "src/core/security/interfaces/custom-request.interface";
import { UsersService } from "../users/services/user.service";
import { MemberService } from "../members/services/member.service";
import { WorkspaceMember } from "../members/entities/member.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly userService: UsersService, 
    private readonly memberService: MemberService,
    private readonly tokenManager: TokenManager,
  ) {}

  /* ---------------- REGISTER ---------------- */
  async register(dto: RegisterDto) {
    const { email, password, confirmPassword, fullName } = dto;

    if (password !== confirmPassword) {
      throw customError.conflict('Passwords do not match');
    }

    const existingUser = await this.userRepo.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw customError.conflict('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const emailCode = generateOtp('numeric', 8);

    const user = this.userRepo.create({
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      emailCode,
    });

    await this.userRepo.save(user);

    // await this.emailService.sendVerificationEmail(user.email, emailCode);

    return {
      message: 'Registration successful. Verify your email.',
    };
  }

  /* ---------------- LOGIN ---------------- */
  async login(dto: LoginDto, req: AuthenticatedRequest) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw customError.unauthorized('Invalid credentials');
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      throw customError.forbidden('Account temporarily locked');
    }

    await this.validatePassword(user, dto.password);

    const tokens = await this.tokenManager.signTokens(user, req, {
      loginType: true,
    });

    return {
      ...tokens,
      // profile: GET_PROFILE(user),
      message: 'Signed in successfully',
    };
  }

  // Update the selectWorkspace method in auth.service.ts
  async selectWorkspace(workspaceId: string, req: AuthenticatedRequest) {
    const user = await this.userService.findById(req.userId);

    if (!user) {
      throw customError.unauthorized('Invalid credentials');
    }

    // Use member service to verify membership
    const result = await this.memberService.findMemberWithWorkspace(
      workspaceId,
      user.id,
    );

    if (!result || !result.member) {
      throw customError.forbidden('Not a member of this workspace');
    }

    // Issue workspace-scoped token
    const accessToken = this.tokenManager.signWorkspaceToken(
      user,
      workspaceId,
      result.member as WorkspaceMember,
    );

    return {
      accessToken,
      workspace: result.workspace,
      message: 'Workspace context established',
    };
  }
  private async validatePassword(user: User, password: string) {
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.failedLoginAttempts = 0;
      }

      await this.userRepo.save(user);
      throw customError.unauthorized('Invalid credentials');
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    await this.userRepo.save(user);
  }

  /* ---------------- VERIFY EMAIL ---------------- */
  async verifyEmail(dto: VerifyEmailDTO, req: AuthenticatedRequest) {
    const user = await this.userRepo.findOne({ where: { id: req.userId } });

    if (!user || user.isEmailVerified) {
      throw customError.badRequest('Invalid verification request');
    }

    if (user.emailCode !== dto.emailCode) {
      throw customError.badRequest('Invalid verification code');
    }

    user.isEmailVerified = true;
    user.emailCode = null;

    await this.userRepo.save(user);

    return { message: 'Email verified successfully' };
  }

  /* ---------------- REQUEST RESET PASSWORD ---------------- */
  async requestResetPassword(dto: RequestResetPasswordDTO) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw customError.badRequest('Invalid request');
    }

    user.passwordResetCode = generateOtp('numeric', 8);
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);

    await this.userRepo.save(user);

    // await this.emailService.sendPasswordResetEmail(
    //   user.email,
    //   user.passwordResetCode,
    // );

    return { message: 'Reset code sent' };
  }

  /* ---------------- RESET PASSWORD ---------------- */
  async resetPassword(dto: ResetPasswordDTO) {
    const user = await this.userRepo.findOne({
      where: {
        email: dto.email.toLowerCase(),
        passwordResetCode: dto.passwordResetCode,
      },
    });

    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw customError.badRequest('Invalid or expired reset code');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    user.passwordResetCode = null;
    user.resetPasswordExpires = null;

    await this.userRepo.save(user);

    return { message: 'Password reset successful' };
  }

  /* ---------------- CHANGE PASSWORD ---------------- */
  async changePassword(dto: ChangePasswordDTO, req: AuthenticatedRequest) {
    const user = await this.userRepo.findOne({ where: { id: req.userId } });

    if (!user) {
      throw customError.notFound('User not found');
    }

    await this.validatePassword(user, dto.password);

    if (dto.newPassword !== dto.confirmNewPassword) {
      throw customError.badRequest('Passwords do not match');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepo.save(user);

    return { message: 'Password changed successfully' };
  }
}
