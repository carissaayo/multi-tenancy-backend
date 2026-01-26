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
var AuthDomainService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthDomainService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jsonwebtoken_1 = require("jsonwebtoken");
const user_entity_1 = require("../../../modules/users/entities/user.entity");
const config_1 = __importDefault(require("../../../config/config"));
const appConfig = (0, config_1.default)();
let AuthDomainService = AuthDomainService_1 = class AuthDomainService {
    jwtService;
    userRepo;
    logger = new common_1.Logger(AuthDomainService_1.name);
    constructor(jwtService, userRepo) {
        this.jwtService = jwtService;
        this.userRepo = userRepo;
    }
    async validateAccessToken(token) {
        let payload;
        try {
            payload = this.jwtService.verify(token, {
                secret: appConfig.jwt.access_token_secret,
            });
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.TokenExpiredError) {
                this.logger.warn('Token expired');
                throw error;
            }
            if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
                this.logger.warn('Invalid token format');
                throw new common_1.UnauthorizedException('Invalid token');
            }
            this.logger.error('JWT verification error:', error);
            throw new common_1.UnauthorizedException('Token verification failed');
        }
        const user = await this.userRepo.findOne({
            where: { id: payload.sub, isActive: true },
        });
        if (!user) {
            this.logger.warn(`Invalid or inactive user: ${payload.sub}`);
            throw new common_1.UnauthorizedException('Invalid or inactive user');
        }
        return {
            user,
            userId: user.id,
            workspaceId: payload.workspaceId,
        };
    }
};
exports.AuthDomainService = AuthDomainService;
exports.AuthDomainService = AuthDomainService = AuthDomainService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        typeorm_2.Repository])
], AuthDomainService);
//# sourceMappingURL=auth-domain.service.js.map