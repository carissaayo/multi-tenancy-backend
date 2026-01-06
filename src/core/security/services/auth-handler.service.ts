import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import type { Request, Response } from 'express';
import { TokenExpiredError } from 'jsonwebtoken';
import { Repository } from 'typeorm';

import { TokenManager } from './token-manager.service';
import { User } from 'src/modules/users/entities/user.entity';
import config from 'src/config/config';

const appConfig = config();

@Injectable()
export class AuthHandler {
  private readonly logger = new Logger(AuthHandler.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly tokenManager: TokenManager,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async authenticateToken(
    req: Request,
    res: Response,
  ): Promise<{
    success: boolean;
    user?: User;
  }> {
    const authHeader = req.headers.authorization;
    const refreshToken = req.headers['refreshtoken'] as string | undefined;

    if (!authHeader?.startsWith('Bearer ')) {
      this.logger.error('❌ AUTH: No Bearer token provided');
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return { success: false };
    }

    const token = authHeader.substring(7);

    try {
      const decoded = this.jwtService.verify(token, {
        secret: appConfig.jwt.access_token_secret,
      }) as { sub: string };

      const user = await this.findUserById(decoded.sub);

      if (!user || !user.isActive) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid or inactive user',
          timestamp: new Date().toISOString(),
        });
        return { success: false };
      }

      return {
        success: true,
        user,
      };
    } catch (err: any) {
      this.logger.error(
        '❌ AUTH: Access token verification failed',
        err?.message,
      );

      if (err instanceof TokenExpiredError && refreshToken) {
        const refreshResult = await this.tokenManager.handleTokenRefresh(
          req,
          res,
          token,
          refreshToken,
        );

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

      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid token',
        timestamp: new Date().toISOString(),
      });

      return { success: false };
    }
  }

  /* ---------------- USER LOOKUP ---------------- */
  private async findUserById(userId: string): Promise<User | null> {
    try {
      return await this.userRepo.findOne({
        where: { id: userId },
      });
    } catch (error) {
      this.logger.error('❌ AUTH: Error finding user', error);
      return null;
    }
  }
}
