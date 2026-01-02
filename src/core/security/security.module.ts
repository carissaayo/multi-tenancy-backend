import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import config from 'src/common/config/config';


// import { RedisRateLimiter } from './services/radis-rate-limiter.service';
import { CorsHandler } from './services/cors-handler.service';
// import { RateLimitHandler } from './services/rate-limit-handler.service';
import { IpReputationHandler } from './services/ip-reputation-handler.service';
import { InputSanitizer } from './services/input-sanitizer.service';
import { AuthHandler } from './services/auth-handler.service';
import { SecurityLogger } from './services/security.logger.service';
import { ResponseMonitor } from './services/response-monitor.service';
import { AttackDetector } from './services/attack-detector.service';
import { TokenManager } from './services/token-manager.service';

import { UserSchema } from 'src/models/user.schema';
import { UserAdminSchema } from 'src/models/admin.schema';

import { SecurityMiddleware } from './middlewares/security.middleware';
import { RefreshTokenSchema } from 'src/models/refreshToken.schema';
import { SecurityLogSchema } from 'src/models/securitylog.schema';

const appConfig = config();
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      secret: appConfig.jwtSecret,
      signOptions: { expiresIn: '1d' },
    }),
    MongooseModule.forFeature([
      { name: 'UserAdmin', schema: UserAdminSchema },
      { name: 'User', schema: UserSchema },
      { name: 'RefreshToken', schema: RefreshTokenSchema },
      { name: 'SecurityLog', schema: SecurityLogSchema },
    ]),
  ],
  providers: [
    CorsHandler,
    // RateLimitHandler,
    IpReputationHandler,
    InputSanitizer,
    AuthHandler,
    SecurityLogger,
    ResponseMonitor,
    AttackDetector,
    TokenManager,
    // RedisRateLimiter,
  ],
  exports: [TokenManager],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityMiddleware).forRoutes('*');
  }
}

/*
NOTE: Avoid `app.use(new SecurityMiddleware())` because it bypasses Nest DI.
*/
