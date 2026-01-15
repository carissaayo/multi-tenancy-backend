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
var EmailVerificationGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailVerificationGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const custom_errors_1 = require("../../error-handler/custom-errors");
const public_decorator_1 = require("../decorators/public.decorator");
const allow_unverified_decorator_1 = require("../decorators/allow-unverified.decorator");
let EmailVerificationGuard = EmailVerificationGuard_1 = class EmailVerificationGuard {
    reflector;
    logger = new common_1.Logger(EmailVerificationGuard_1.name);
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            this.logger.debug('No user found - authentication middleware will handle authentication');
            return true;
        }
        const allowUnverified = this.reflector.getAllAndOverride(allow_unverified_decorator_1.ALLOW_UNVERIFIED_KEY, [context.getHandler(), context.getClass()]);
        if (allowUnverified) {
            this.logger.debug(`Route allows unverified users, skipping email verification for user ${user.id}`);
            return true;
        }
        if (!user.isEmailVerified) {
            this.logger.warn(`Email verification required: User ${user.id} attempted to access protected route without verified email`);
            throw custom_errors_1.customError.forbidden('Please verify your email address to access this resource. Check your inbox for the verification link.');
        }
        this.logger.debug(`✅ Email verification check passed for user ${user.id}`);
        return true;
    }
};
exports.EmailVerificationGuard = EmailVerificationGuard;
exports.EmailVerificationGuard = EmailVerificationGuard = EmailVerificationGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], EmailVerificationGuard);
//# sourceMappingURL=email-verification.guard.js.map