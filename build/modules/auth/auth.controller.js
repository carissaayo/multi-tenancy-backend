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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_dto_1 = require("./auth.dto");
const auth_service_1 = require("./auth.service");
const public_decorator_1 = require("../../core/security/decorators/public.decorator");
const allow_unverified_decorator_1 = require("../../core/security/decorators/allow-unverified.decorator");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    register(dto) {
        return this.authService.register(dto);
    }
    login(loginDto, req) {
        return this.authService.login(loginDto, req);
    }
    verifyEmail(verifyEmailDto, req) {
        return this.authService.verifyEmail(verifyEmailDto, req);
    }
    resendVerificationEmail(req) {
        return this.authService.resendVerificationEmail(req);
    }
    passwordResetRequest(resetPasswordDto) {
        return this.authService.requestResetPassword(resetPasswordDto);
    }
    resetPassword(resetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }
    changePassword(changePasswordDto, req) {
        return this.authService.changePassword(changePasswordDto, req);
    }
    selectWorkspace(selectWorkspaceDto, req) {
        return this.authService.selectWorkspace(selectWorkspaceDto, req);
    }
    logout(req) {
        return this.authService.logout(req, false);
    }
    logoutAll(req) {
        return this.authService.logout(req, true);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User registered successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Login user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login successful' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('verify-email'),
    (0, allow_unverified_decorator_1.AllowUnverified)(),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify user email' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email verified successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.VerifyEmailDTO, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('resend-verification-email'),
    (0, allow_unverified_decorator_1.AllowUnverified)(),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Resend verification email' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Verification email sent' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resendVerificationEmail", null);
__decorate([
    (0, common_1.Post)('request-password-reset'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Request password reset' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password reset email sent' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RequestResetPasswordDTO]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "passwordResetRequest", null);
__decorate([
    (0, common_1.Post)('password-reset'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Reset password' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password reset successful' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ResetPasswordDTO]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, allow_unverified_decorator_1.AllowUnverified)(),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Change user password' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password changed successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ChangePasswordDTO, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('select-workspace'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Select workspace' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace selected successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.SelectWorkspaceDTO, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "selectWorkspace", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Logout user (current device)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logged out successfully' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('logout/all'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Logout user from all devices' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Logged out from all devices successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logoutAll", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Authentication'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map