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
var TokenManager_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenManager = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const ms_1 = __importDefault(require("ms"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = __importDefault(require("../../../config/config"));
const user_entity_1 = require("../../../modules/users/entities/user.entity");
const refresh_token_entity_1 = require("../entities/refresh-token.entity");
const custom_errors_1 = require("../../error-handler/custom-errors");
const appConfig = (0, config_1.default)();
let TokenManager = TokenManager_1 = class TokenManager {
    jwtService;
    userRepo;
    refreshTokenRepo;
    logger = new common_1.Logger(TokenManager_1.name);
    constructor(jwtService, userRepo, refreshTokenRepo) {
        this.jwtService = jwtService;
        this.userRepo = userRepo;
        this.refreshTokenRepo = refreshTokenRepo;
    }
    async handleTokenRefresh(req, res, expiredAccessToken, refreshToken) {
        try {
            const decodedRefresh = this.jwtService.verify(refreshToken, {
                secret: appConfig.jwt.refresh_token_secret,
            });
            const expiredDecoded = this.jwtService.decode(expiredAccessToken);
            if (decodedRefresh.sub !== expiredDecoded?.sub) {
                throw custom_errors_1.customError.unauthorized('Token binding mismatch');
            }
            const tokenHash = this.hashToken(refreshToken);
            const storedToken = await this.refreshTokenRepo.findOne({
                where: {
                    tokenHash,
                    userId: decodedRefresh.sub,
                    isRevoked: false,
                    expiresAt: (0, typeorm_2.MoreThan)(new Date()),
                },
            });
            if (!storedToken) {
                throw custom_errors_1.customError.unauthorized('Invalid refresh token');
            }
            const user = await this.userRepo.findOne({
                where: { id: decodedRefresh.sub },
            });
            if (!user || !user.isActive) {
                throw custom_errors_1.customError.unauthorized('Invalid or inactive user');
            }
            storedToken.lastUsedAt = new Date();
            await this.refreshTokenRepo.save(storedToken);
            return { success: true, user };
        }
        catch (err) {
            res.status(common_1.HttpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Token refresh failed',
            });
            return { success: false };
        }
    }
    hashToken(token) {
        return require('crypto').createHash('sha256').update(token).digest('hex');
    }
    async storeRefreshToken(userId, refreshToken, req, expiresIn = '7d') {
        const tokenHash = this.hashToken(refreshToken);
        const expiresMs = (0, ms_1.default)(expiresIn);
        const expiresAt = new Date(Date.now() + expiresMs);
        const ipAddress = req ? this.getClientIP(req) : '';
        const userAgent = req?.headers['user-agent'] || '';
        await this.refreshTokenRepo.update({ userId, ipAddress, userAgent, isRevoked: false }, { isRevoked: true });
        await this.refreshTokenRepo.save({
            userId,
            tokenHash,
            expiresAt,
            ipAddress,
            userAgent,
            isRevoked: false,
            lastUsedAt: new Date(),
        });
    }
    getClientIP(req) {
        const xfwd = req.headers['x-forwarded-for']
            ?.split(',')[0]
            ?.trim();
        const xreal = req.headers['x-real-ip']?.trim();
        const conn = req.connection?.remoteAddress;
        const sock = req.socket?.remoteAddress;
        return xfwd || xreal || conn || sock || '127.0.0.1';
    }
    async signTokens(user, req, options) {
        const workspace = req.workspace;
        const member = req.workspaceMember;
        const memberRole = req.workspaceMemberRole;
        const accessToken = this.jwtService.sign({
            sub: user.id,
            email: user.email,
            workspaceId: workspace,
            isActive: user.isActive,
            iat: Math.floor(Date.now() / 1000),
        }, {
            expiresIn: appConfig.jwt.duration10m,
            secret: appConfig.jwt.access_token_secret,
        });
        let refreshToken;
        if (options?.loginType) {
            const refreshExpiresIn = appConfig.jwt.duration7d;
            refreshToken = this.jwtService.sign({
                sub: user.id,
                type: 'refresh',
                iat: Math.floor(Date.now() / 1000),
            }, {
                expiresIn: refreshExpiresIn,
                secret: appConfig.jwt.refresh_token_secret,
            });
            await this.storeRefreshToken(user.id, refreshToken, req, refreshExpiresIn);
        }
        return { accessToken, refreshToken };
    }
    async signGlobalTokens(user, req) {
        const accessToken = this.jwtService.sign({
            sub: user.id,
            email: user.email,
            type: 'global',
            isActive: user.isActive,
            iat: Math.floor(Date.now() / 1000),
        }, {
            expiresIn: appConfig.jwt.duration10m,
            secret: appConfig.jwt.access_token_secret,
        });
        const refreshToken = this.jwtService.sign({
            sub: user.id,
            type: 'refresh',
            iat: Math.floor(Date.now() / 1000),
        }, {
            expiresIn: appConfig.jwt.duration7d,
            secret: appConfig.jwt.refresh_token_secret,
        });
        await this.storeRefreshToken(user.id, refreshToken, req);
        return { accessToken, refreshToken };
    }
    signWorkspaceToken(user, workspaceId, member) {
        return this.jwtService.sign({
            sub: user.id,
            email: user.email,
            workspaceId: workspaceId,
            memberId: member.id,
            role: member.role,
            type: 'workspace',
            isActive: user.isActive,
            iat: Math.floor(Date.now() / 1000),
        }, {
            expiresIn: appConfig.jwt.duration10m,
            secret: appConfig.jwt.access_token_secret,
        });
    }
};
exports.TokenManager = TokenManager;
exports.TokenManager = TokenManager = TokenManager_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(refresh_token_entity_1.RefreshToken)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TokenManager);
//# sourceMappingURL=token-manager.service.js.map