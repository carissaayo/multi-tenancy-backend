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
var AuthHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthHandler = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const jsonwebtoken_1 = require("jsonwebtoken");
const typeorm_2 = require("typeorm");
const token_manager_service_1 = require("./token-manager.service");
const user_entity_1 = require("../../../modules/users/entities/user.entity");
const config_1 = __importDefault(require("../../../config/config"));
const auth_domain_service_1 = require("./auth-domain.service");
const appConfig = (0, config_1.default)();
let AuthHandler = AuthHandler_1 = class AuthHandler {
    jwtService;
    tokenManager;
    authDomain;
    userRepo;
    logger = new common_1.Logger(AuthHandler_1.name);
    constructor(jwtService, tokenManager, authDomain, userRepo) {
        this.jwtService = jwtService;
        this.tokenManager = tokenManager;
        this.authDomain = authDomain;
        this.userRepo = userRepo;
    }
    async authenticateToken(req, res) {
        const authHeader = req.headers.authorization;
        const refreshToken = req.headers['refreshtoken'];
        if (!authHeader?.startsWith('Bearer ')) {
            this.logger.error('❌ AUTH: No Bearer token provided');
            res.status(common_1.HttpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Authentication required',
                timestamp: new Date().toISOString(),
            });
            return { success: false };
        }
        const token = authHeader.substring(7);
        try {
            const { user } = await this.authDomain.validateAccessToken(token);
            return {
                success: true,
                user,
            };
        }
        catch (err) {
            this.logger.error('❌ AUTH: Access token verification failed', err?.message);
            if (err instanceof jsonwebtoken_1.TokenExpiredError && refreshToken) {
                const refreshResult = await this.tokenManager.handleTokenRefresh(req, res, token, refreshToken);
                if (refreshResult.success) {
                    this.logger.log('✅ AUTH: Token refreshed successfully');
                    return {
                        success: true,
                        user: refreshResult.user,
                    };
                }
                this.logger.error('❌ AUTH: Token refresh failed');
                return { success: false };
            }
            res.status(common_1.HttpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Invalid token',
                timestamp: new Date().toISOString(),
            });
            return { success: false };
        }
    }
    async findUserById(userId) {
        try {
            return await this.userRepo.findOne({
                where: { id: userId },
            });
        }
        catch (error) {
            this.logger.error('❌ AUTH: Error finding user', error);
            return null;
        }
    }
};
exports.AuthHandler = AuthHandler;
exports.AuthHandler = AuthHandler = AuthHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        token_manager_service_1.TokenManager,
        auth_domain_service_1.AuthDomainService,
        typeorm_2.Repository])
], AuthHandler);
//# sourceMappingURL=auth-handler.service.js.map