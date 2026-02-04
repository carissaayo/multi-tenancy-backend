import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { StringValue } from 'ms';

import { CorsHandler } from './services/cors-handler.service';
import { IpReputationHandler } from './services/ip-reputation-handler.service';
import { InputSanitizer } from './services/input-sanitizer.service';
import { AuthHandler } from './services/auth-handler.service';
import { ResponseMonitor } from './services/response-monitor.service';
import { AttackDetector } from './services/attack-detector.service';
import { TokenManager } from './services/token-manager.service';
import { RateLimitHandler } from './services/rate-limit-handler.service';
import { RedisRateLimiter } from './services/radis-rate-limiter.service';
import { AuthDomainService } from './services/auth-domain.service';

import { TenantResolverMiddleware } from './middlewares/tenancy-resolver.middleware';
import { SecurityMiddleware } from './middlewares/security.middleware';

import { EmailVerificationGuard } from './guards/email-verification.guard';

import { RefreshToken } from './entities/refresh-token.entity'; 
import { User } from 'src/modules/users/entities/user.entity';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('ACCESS_TOKEN_SECRET') || 'default-secret',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_DURATION_10M') ||
            '10m') as StringValue,
        },
      }),
    }),

    TypeOrmModule.forFeature([User, RefreshToken]),
  ],
  providers: [
    CorsHandler,
    IpReputationHandler,
    InputSanitizer,
    AuthHandler,
    AuthDomainService,
    ResponseMonitor,
    AttackDetector,
    TokenManager,
    RateLimitHandler,
    RedisRateLimiter,
    TenantResolverMiddleware,
  ],
  exports: [TokenManager, AuthHandler, AuthDomainService],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*')
      .apply(TenantResolverMiddleware)
      .forRoutes('*');
  }
}
