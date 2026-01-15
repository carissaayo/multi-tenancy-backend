"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const cors_handler_service_1 = require("./services/cors-handler.service");
const ip_reputation_handler_service_1 = require("./services/ip-reputation-handler.service");
const input_sanitizer_service_1 = require("./services/input-sanitizer.service");
const auth_handler_service_1 = require("./services/auth-handler.service");
const response_monitor_service_1 = require("./services/response-monitor.service");
const attack_detector_service_1 = require("./services/attack-detector.service");
const token_manager_service_1 = require("./services/token-manager.service");
const security_middleware_1 = require("./middlewares/security.middleware");
const user_entity_1 = require("../../modules/users/entities/user.entity");
const refresh_token_entity_1 = require("./entities/refresh-token.entity");
const rate_limit_handler_service_1 = require("./services/rate-limit-handler.service");
const radis_rate_limiter_service_1 = require("./services/radis-rate-limiter.service");
const tenancy_resolver_middleware_1 = require("./middlewares/tenancy-resolver.middleware");
const core_1 = require("@nestjs/core");
const email_verification_guard_1 = require("./guards/email-verification.guard");
let SecurityModule = class SecurityModule {
    configure(consumer) {
        consumer
            .apply(tenancy_resolver_middleware_1.TenantResolverMiddleware)
            .forRoutes('*')
            .apply(security_middleware_1.SecurityMiddleware)
            .forRoutes('*');
    }
};
exports.SecurityModule = SecurityModule;
exports.SecurityModule = SecurityModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get('ACCESS_TOKEN_SECRET') || 'default-secret',
                    signOptions: {
                        expiresIn: (configService.get('JWT_DURATION_10M') ||
                            '10m'),
                    },
                }),
            }),
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, refresh_token_entity_1.RefreshToken]),
        ],
        providers: [
            cors_handler_service_1.CorsHandler,
            ip_reputation_handler_service_1.IpReputationHandler,
            input_sanitizer_service_1.InputSanitizer,
            auth_handler_service_1.AuthHandler,
            response_monitor_service_1.ResponseMonitor,
            attack_detector_service_1.AttackDetector,
            token_manager_service_1.TokenManager,
            rate_limit_handler_service_1.RateLimitHandler,
            radis_rate_limiter_service_1.RedisRateLimiter,
            tenancy_resolver_middleware_1.TenantResolverMiddleware,
            {
                provide: core_1.APP_GUARD,
                useClass: email_verification_guard_1.EmailVerificationGuard,
            },
        ],
        exports: [token_manager_service_1.TokenManager, auth_handler_service_1.AuthHandler],
    })
], SecurityModule);
//# sourceMappingURL=security.module.js.map