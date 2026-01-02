/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import type { Request, Response } from 'express';
import { Model } from 'mongoose';
import ms from 'ms';




import config from 'src/common/config/config';
// import { RedisRateLimiter } from './radis-rate-limiter.service';
import { SecurityLogger } from './security.logger.service';
import { User } from 'src/models/user.schema';
import { AuthResult } from '../interfaces/security.interface';

import { AuthenticatedRequest } from '../interfaces/custom-request.interface';
import { UserAdmin } from 'src/models/admin.schema';
import { RefreshToken } from 'src/models/refreshToken.schema';
import { UserRole } from 'src/app/user/user.interface';

const appConfig = config();

@Injectable()
export class TokenManager {
  private readonly logger = new Logger(TokenManager.name);

  constructor(
    private readonly jwtService: JwtService,
    // private readonly redisRateLimiter: RedisRateLimiter,
    private readonly securityLogger: SecurityLogger,
    @InjectModel('UserAdmin') private readonly userAdminModel: Model<UserAdmin>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('RefreshToken')
    private readonly refreshTokenModel: Model<RefreshToken>,
  ) {}
  async handleTokenRefresh(
    req: Request,
    res: Response,
    expiredAccessToken: string,
    refreshToken: string,
  ): Promise<AuthResult> {
    try {
      // 1. Rate limiting (optional but recommended)
      // const clientIP = this.getClientIP(req);
      // const refreshRateLimit = await this.redisRateLimiter.checkRateLimit(
      //   `refresh:${clientIP}`,
      //   {
      //     windowMs: 15 * 60 * 1000,
      //     maxRequests: 10,
      //     blockDurationMs: 60 * 60 * 1000,
      //   },
      // );

      // if (refreshRateLimit.isBlocked) {
      //   res.status(HttpStatus.TOO_MANY_REQUESTS).json({
      //     success: false,
      //     message: 'Too many refresh attempts. Try again later.',
      //     timestamp: new Date().toISOString(),
      //   });
      //   return { success: false };
      // }

      // 2. Verify refresh token JWT
      const decodedRefresh: any = this.jwtService.verify(refreshToken, {
        secret: appConfig.jwt.refresh_token_secret,
      });

      // 3. Extract userId from expired access token for binding
      const expiredDecoded = this.jwtService.decode(expiredAccessToken) as any;
      const expiredUserId = expiredDecoded?.sub;

      if (decodedRefresh.sub !== expiredUserId) {
        this.logger.error('Token binding verification failed');
        await this.securityLogger.logSecurityEvent(
          req,
          res,
          true,
          'Token binding mismatch',
        );
        throw new Error('Token binding verification failed');
      }

      // 4. Find hashed token in DB
      const tokenHash = this.hashToken(refreshToken);
      const storedRefreshToken = await this.refreshTokenModel.findOne({
        tokenHash,
        userId: String(decodedRefresh.sub),
        role: decodedRefresh.role,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      });

      if (!storedRefreshToken) {
        this.logger.error('Refresh token not found or expired');
        await this.securityLogger.logSecurityEvent(
          req,
          res,
          true,
          'Invalid refresh token',
        );
        throw new Error('Refresh token not found or expired');
      }

      // 5. Validate user account
      const user = await this.findUserById(
        decodedRefresh.sub,
        decodedRefresh.role,
      );

      if (!user || !user.isActive) {
        this.logger.error('Invalid or inactive user account');
        throw new Error('Invalid or inactive user account');
      }

      // 6. Update lastUsedAt via trackSession
      await this.trackSession(req, user, tokenHash);

      // 7. Generate new access token ONLY
      const newAccessToken = this.jwtService.sign(
        {
          sub: user._id,
          email: user.email,
          phoneNumber: (user as any).phoneNumber,
          role: user.role,
          isActive: user.isActive,
          iat: Math.floor(Date.now() / 1000),
        },
        {
          expiresIn: appConfig.jwt.duration10m,
          secret: appConfig.jwt.access_token_secret,
        },
      );

      // 8. Return access token (refresh token remains the same)
      res.setHeader('x-access-token', newAccessToken);

      await this.securityLogger.logSecurityEvent(
        req,
        res,
        false,
        'Token refresh successful',
      );

      this.logger.log('✅ Token refresh successful');

      return {
        success: true,
        user: user.toObject() as unknown as UserAdmin | User ,
      };
    } catch (err: any) {
      this.logger.error('❌ Token refresh failed', {
        error: err.message,
        ip: this.getClientIP(req),
      });

      await this.securityLogger.logSecurityEvent(
        req,
        res,
        true,
        `Token refresh failed: ${err.message}`,
      );

      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Token refresh failed',
        timestamp: new Date().toISOString(),
      });

      return { success: false };
    }
  }

  // Helper methods for token management
  private hashToken(token: string): string {
    return require('crypto').createHash('sha256').update(token).digest('hex');
  }

  private async storeRefreshToken(
    userId: string,
    role: UserRole,
    refreshToken: string,
    req?: Request,
    loginType?: boolean,
    expiresIn = '365d',
  ): Promise<void> {
    const hashedToken = this.hashToken(refreshToken);
    const expiresMs = ms(expiresIn);

    if (!expiresMs) {
      throw new Error(`Invalid expiresIn format: ${expiresIn}`);
    }
    const expiresAt = new Date(Date.now() + expiresMs);

    const ipAddress = req ? this.getClientIP(req) : '';
    const userAgent = req?.headers['user-agent'] || '';

    // Revoke any existing token for this device
    await this.refreshTokenModel.updateMany(
      {
        userId,
        role,
        ipAddress,
        userAgent,
        isRevoked: false,
      },
      { isRevoked: true },
    );

    // Create new refresh token record
    await this.refreshTokenModel.create({
      tokenHash: hashedToken,
      userId,
      role,
      expiresAt,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      isRevoked: false,
      userAgent,
      ipAddress,
      loginType,
    });
  }

  private getClientIP(req: Request): string {
    const xfwd = (req.headers['x-forwarded-for'] as string | undefined)
      ?.split(',')[0]
      ?.trim();
    const xreal = (req.headers['x-real-ip'] as string | undefined)?.trim();
    const conn = (req as any).connection?.remoteAddress as string | undefined;
    const sock = (req.socket as any)?.remoteAddress as string | undefined;
    return xfwd || xreal || conn || sock || '127.0.0.1';
  }

  public async signTokens(
    user: UserAdmin | User ,
    req: Request | AuthenticatedRequest,
    options?: { shortRefresh?: boolean; loginType?: boolean },
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    // 1. Always generate new access token
    const accessPayload = {
      sub: user._id,
      phoneNumber: (user as any).phoneNumber ?? user.email,
      role: user.role,
      isActive: user.isActive,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: appConfig.jwt.duration10m,
      secret: appConfig.jwt.access_token_secret,
    });

    // 2. Only generate refresh token if loginType exists (login request)
    let refreshToken: string | undefined;

    if (options?.loginType) {
      const refreshExpiresIn = options?.shortRefresh
        ? appConfig.jwt.duration1d
        : appConfig.jwt.duration1Yr;

      // 3. Revoke existing refresh token for this device (IP + UA)
      const ipAddress = req ? this.getClientIP(req) : '';
      const userAgent = req?.headers['user-agent'] || '';

      const existingToken = await this.refreshTokenModel.findOne({
        userId: String(user._id),
        role: user.role,
        ipAddress,
        userAgent,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      });

      if (existingToken) {
        existingToken.isRevoked = true;
        await existingToken.save();
      }

      // 4. Generate new refresh token and store it
      const refreshPayload = {
        sub: user._id,
        type: 'refresh',
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        loginType: options.loginType,
      };

      refreshToken = this.jwtService.sign(refreshPayload, {
        expiresIn: refreshExpiresIn,
        secret: appConfig.jwt.refresh_token_secret,
      });

      await this.storeRefreshToken(
        String(user._id),
        user.role,
        refreshToken,
        req,
        options.loginType,
        refreshExpiresIn,
      );
    }

    return { accessToken, refreshToken };
  }

  private async trackSession(
    req: Request,
    user: User | UserAdmin ,
    tokenHash: string,
  ): Promise<void> {
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Just update lastUsedAt for the token
    const existingToken = await this.refreshTokenModel.findOne({
      tokenHash,
      userId: String(user._id),
      role: user.role,
      isRevoked: false,
      ipAddress,
      userAgent,
    });

    if (existingToken) {
      existingToken.lastUsedAt = new Date();
      await existingToken.save();
    }
    // If not found, it's already handled in handleTokenRefresh
  }

  private async findUserById(
    userId: string,
    role: UserRole,
  ): Promise<(UserAdmin | User) | null> {
    let user: User | UserAdmin | null = null;
    if (role === UserRole.INSTRUCTOR || role === UserRole.STUDENT) {
      user = await this.userModel.findById(userId).exec();
    }

    if (role === UserRole.ADMIN) {
      user = await this.userAdminModel.findById(userId).exec();
    }

    return user;
  }
}
