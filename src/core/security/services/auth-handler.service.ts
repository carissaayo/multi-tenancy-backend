import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import type { Request, Response } from 'express';
import { Model } from 'mongoose';
import { TokenExpiredError } from 'jsonwebtoken';

import { TokenManager } from './token-manager.service';

import { User } from 'src/models/user.schema';
import config from 'src/common/config/config';
import { UserAdmin } from 'src/models/admin.schema';
import { UserRole } from 'src/app/user/user.interface';

const appConfig = config();

@Injectable()
export class AuthHandler {
  private readonly logger = new Logger(AuthHandler.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly tokenManager: TokenManager,
    @InjectModel('UserAdmin') private readonly userAdminModel: Model<UserAdmin>,
    @InjectModel('User') private readonly userModel: Model<User>,
 
  ) {}

  async authenticateToken(
    req: Request,
    res: Response,
  ): Promise<{
    success: boolean;
    user?: UserAdmin | User;
  }> {
    const authHeader = req.headers.authorization;
    const refreshToken = req.headers['refreshtoken'] as string | undefined;
    console.log(refreshToken, 'refreshTIoken');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded: any = this.jwtService.verify(token, {
          secret: appConfig.jwt.access_token_secret,
        });

        // Find user from either collection
        const foundUser = await this.findUserById(decoded.sub, decoded.role);
        console.log(foundUser,"foundUser====");
        

        if (!foundUser || !foundUser.isActive) {
          res.status(HttpStatus.UNAUTHORIZED).json({
            success: false,
            message: 'Invalid or inactive user',
            timestamp: new Date().toISOString(),
          });
          return { success: false };
        }

        return {
          success: true,
          user: foundUser.toObject() ,
        };
      } catch (err) {
        this.logger.error(
          '❌ AUTH: Access token verification failed:',
          err.message,
        );

        if (err instanceof TokenExpiredError && refreshToken) {
          const refreshResult = await this.tokenManager.handleTokenRefresh(
            req,
            res,
            token,
            refreshToken,
          );

          if (refreshResult.success) {
            this.logger.log(
              '✅ AUTH: Token refreshed successfully, allowing request',
            );
            return {
              success: true,
              user: refreshResult.user,
            };
          }

          this.logger.error('❌ AUTH: Token refresh failed');
          return { success: false };
        }

        this.logger.error('❌ AUTH: Non-recoverable JWT error');
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid token',
          timestamp: new Date().toISOString(),
        });
        return { success: false };
      }
    }

    this.logger.error('❌ AUTH: No Bearer token provided');
    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return { success: false };
  }

  /**
   * Tries to find user from either User or UserAdmin collection
   */
  private async findUserById(
    userId: string,
    role: UserRole,
  ): Promise<User | UserAdmin | null> {
    try {
      let user: User | UserAdmin | null = null;

      if (role === UserRole.ADMIN) {
        user = await this.userAdminModel.findById(userId).exec();
      }else{
        user = await this.userModel.findById(userId).exec();
      }

     

      return user;
    } catch (error) {
      this.logger.error('❌ AUTH: Error finding user:', error);
      return null;
    }
  }
}
