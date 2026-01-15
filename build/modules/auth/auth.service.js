"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const user_entity_1 = require("../users/entities/user.entity");
const token_manager_service_1 = require("../../core/security/services/token-manager.service");
const custom_errors_1 = require("../../core/error-handler/custom-errors");
const util_1 = require("../../utils/util");
const user_service_1 = require("../users/services/user.service");
const member_service_1 = require("../members/services/member.service");
const email_service_1 = require("../../core/email/services/email.service");
const workspace_entity_1 = require("../workspaces/entities/workspace.entity");
let AuthService = class AuthService {
    userRepo;
    workspaceRepo;
    userService;
    memberService;
    tokenManager;
    emailService;
    constructor(userRepo, workspaceRepo, userService, memberService, tokenManager, emailService) {
        this.userRepo = userRepo;
        this.workspaceRepo = workspaceRepo;
        this.userService = userService;
        this.memberService = memberService;
        this.tokenManager = tokenManager;
        this.emailService = emailService;
    }
    async register(dto) {
        const { email, password, confirmPassword, fullName, phoneNumber } = dto;
        if (password !== confirmPassword) {
            throw custom_errors_1.customError.conflict('Passwords do not match');
        }
        const existingUser = await this.userRepo.findOne({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            throw custom_errors_1.customError.conflict('Email already in use');
        }
        const existingPhone = await this.userRepo.findOne({
            where: { phoneNumber: dto.phoneNumber },
        });
        if (existingPhone) {
            throw custom_errors_1.customError.conflict('Phone number already in use');
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const emailCode = (0, util_1.generateOtp)('numeric', 8);
        const user = this.userRepo.create({
            email: email.toLowerCase(),
            passwordHash,
            fullName,
            phoneNumber,
            emailCode,
        });
        await this.userRepo.save(user);
        await this.emailService.sendVerificationEmail(user.email, emailCode);
        return {
            message: 'Registration successful. Verify your email.',
        };
    }
    async login(dto, req) {
        const user = await this.userRepo.findOne({
            where: { email: dto.email.toLowerCase() },
        });
        if (!user) {
            throw custom_errors_1.customError.unauthorized('Invalid credentials');
        }
        if (user.lockUntil && user.lockUntil > new Date()) {
            throw custom_errors_1.customError.forbidden('Account temporarily locked');
        }
        await this.validatePassword(user, dto.password);
        const tokens = await this.tokenManager.signTokens(user, req, {
            loginType: true,
        });
        const userProfile = this.userService.getUserProfile(user);
        return {
            ...tokens,
            profile: userProfile,
            message: 'Signed in successfully',
        };
    }
    async selectWorkspace(dto, req) {
        const { workspaceId } = dto;
        if (!(0, uuid_1.validate)(workspaceId)) {
            throw custom_errors_1.customError.badRequest('Invalid workspace ID');
        }
        const user = await this.userService.findById(req.userId);
        if (!user) {
            throw custom_errors_1.customError.unauthorized('Invalid credentials');
        }
        const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
        if (!workspace) {
            throw custom_errors_1.customError.notFound('Workspace not found');
        }
        const result = await this.memberService.isUserMember(workspaceId, user.id);
        if (!result) {
            throw custom_errors_1.customError.forbidden('Not a member of this workspace');
        }
        const accessToken = this.tokenManager.signWorkspaceToken(user, workspaceId, result);
        return {
            accessToken,
            workspace: workspace,
            message: 'Workspace context established',
        };
    }
    async validatePassword(user, password) {
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
                user.failedLoginAttempts = 0;
            }
            await this.userRepo.save(user);
            throw custom_errors_1.customError.unauthorized('Invalid credentials');
        }
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        user.lastLoginAt = new Date();
        await this.userRepo.save(user);
    }
    async verifyEmail(dto, req) {
        const user = await this.userRepo.findOne({ where: { id: req.userId } });
        if (!user) {
            throw custom_errors_1.customError.notFound('User not found');
        }
        if (user.isEmailVerified) {
            throw custom_errors_1.customError.badRequest('You have already verified your email address');
        }
        if (user.emailCode !== dto.emailCode) {
            throw custom_errors_1.customError.badRequest('Invalid verification code');
        }
        user.isEmailVerified = true;
        user.emailCode = null;
        await this.userRepo.save(user);
        return { message: 'Email verified successfully' };
    }
    async resendVerificationEmail(req) {
        const user = await this.userRepo.findOne({ where: { id: req.userId } });
        if (!user) {
            throw custom_errors_1.customError.notFound('User not found');
        }
        if (user.isEmailVerified) {
            throw custom_errors_1.customError.badRequest('You have already verified your email address');
        }
        const emailCode = (0, util_1.generateOtp)('numeric', 8);
        user.emailCode = emailCode;
        await this.userRepo.save(user);
        await this.emailService.sendVerificationEmail(user.email, emailCode);
        return { message: 'Verification email sent' };
    }
    async requestResetPassword(dto) {
        const user = await this.userRepo.findOne({
            where: { email: dto.email.toLowerCase() },
        });
        if (!user || !user.isActive) {
            throw custom_errors_1.customError.badRequest('Invalid request');
        }
        user.passwordResetCode = (0, util_1.generateOtp)('numeric', 8);
        user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
        await this.userRepo.save(user);
        return { message: 'Reset code sent' };
    }
    async resetPassword(dto) {
        const user = await this.userRepo.findOne({
            where: {
                email: dto.email.toLowerCase(),
                passwordResetCode: dto.passwordResetCode,
            },
        });
        if (!user ||
            !user.resetPasswordExpires ||
            user.resetPasswordExpires < new Date()) {
            throw custom_errors_1.customError.badRequest('Invalid or expired reset code');
        }
        user.passwordHash = await bcryptjs_1.default.hash(dto.newPassword, 12);
        user.passwordResetCode = null;
        user.resetPasswordExpires = null;
        await this.userRepo.save(user);
        return { message: 'Password reset successful' };
    }
    async changePassword(dto, req) {
        const user = await this.userRepo.findOne({ where: { id: req.userId } });
        if (!user) {
            throw custom_errors_1.customError.notFound('User not found');
        }
        await this.validatePassword(user, dto.password);
        if (dto.newPassword !== dto.confirmNewPassword) {
            throw custom_errors_1.customError.badRequest('Passwords do not match');
        }
        user.passwordHash = await bcryptjs_1.default.hash(dto.newPassword, 12);
        await this.userRepo.save(user);
        return { message: 'Password changed successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(workspace_entity_1.Workspace)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        user_service_1.UsersService,
        member_service_1.MemberService,
        token_manager_service_1.TokenManager,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map