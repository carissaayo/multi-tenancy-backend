import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StringValue } from 'ms';
import { CorsHandler } from './services/cors-handler.service';
import { IpReputationHandler } from './services/ip-reputation-handler.service';
import { InputSanitizer } from './services/input-sanitizer.service';
import { AuthHandler } from './services/auth-handler.service';
import { ResponseMonitor } from './services/response-monitor.service';
import { AttackDetector } from './services/attack-detector.service';
import { TokenManager } from './services/token-manager.service';
import { SecurityMiddleware } from './middlewares/security.middleware';
import { User } from 'src/modules/users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity'; 
import { publicRoutes } from './constants/public-routes';
import { RateLimitHandler } from './services/rate-limit-handler.service';
import { RedisRateLimiter } from './services/radis-rate-limiter.service';
import { TenantResolverMiddleware } from './middlewares/tenancy-resolver.middleware';

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
    ResponseMonitor,
    AttackDetector,
    TokenManager,
    RateLimitHandler,
    RedisRateLimiter,
  ],
  exports: [TokenManager, AuthHandler],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      // .apply(TenantResolverMiddleware)
      // .forRoutes('*')
      .apply(SecurityMiddleware)
      .forRoutes("*");
  }
}
