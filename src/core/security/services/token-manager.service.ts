import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import ms, { StringValue } from 'ms';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';

import { AuthResult } from '../interfaces/security.interface';

import { AuthenticatedRequest } from '../interfaces/custom-request.interface';

import config from 'src/config/config';
import { User } from 'src/modules/users/entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { customError } from 'src/core/error-handler/custom-errors';
import { WorkspaceMember } from 'src/modules/members/entities/member.entity';

const appConfig = config();

@Injectable()
export class TokenManager {
  private readonly logger = new Logger(TokenManager.name);

  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}
  async handleTokenRefresh(
    req: Request,
    res: Response,
    expiredAccessToken: string,
    refreshToken: string,
  ): Promise<AuthResult & { accessToken?: string }> {
    try {
      const decodedRefresh = this.jwtService.verify(refreshToken, {
        secret: appConfig.jwt.refresh_token_secret,
      });

      const expiredDecoded = this.jwtService.decode(expiredAccessToken) as any;

      if (decodedRefresh.sub !== expiredDecoded?.sub) {
        throw customError.unauthorized('Token binding mismatch');
      }

      const tokenHash = this.hashToken(refreshToken);

      const storedToken = await this.refreshTokenRepo.findOne({
        where: {
          tokenHash,
          userId: decodedRefresh.sub,
          isRevoked: false,
          expiresAt: MoreThan(new Date()),
        },
      });

      if (!storedToken) {
        throw customError.unauthorized('Invalid refresh token');
      }

      const user = await this.userRepo.findOne({
        where: { id: decodedRefresh.sub },
      });

      if (!user || !user.isActive) {
        throw customError.unauthorized('Invalid or inactive user');
      }

      storedToken.lastUsedAt = new Date();
      await this.refreshTokenRepo.save(storedToken);

      // Generate new access token with same workspace context if available
      let newAccessToken: string;
      if (expiredDecoded?.workspaceId) {
        // If there was a workspace context, try to preserve it
        // Note: This requires member lookup - simplified version
        newAccessToken = this.jwtService.sign(
          {
            sub: user.id,
            email: user.email,
            workspaceId: expiredDecoded.workspaceId,
            isActive: user.isActive,
            iat: Math.floor(Date.now() / 1000),
          },
          {
            expiresIn: appConfig.jwt.duration10m as StringValue,
            secret: appConfig.jwt.access_token_secret,
          },
        );
      } else {
        newAccessToken = this.jwtService.sign(
          {
            sub: user.id,
            email: user.email,
            type: 'global',
            isActive: user.isActive,
            iat: Math.floor(Date.now() / 1000),
          },
          {
            expiresIn: appConfig.jwt.duration10m as StringValue,
            secret: appConfig.jwt.access_token_secret,
          },
        );
      }

      // Set new access token in response header
      res.setHeader('X-New-Access-Token', newAccessToken);

      return {
        success: true,
        user,
        accessToken: newAccessToken, // Also return it for convenience
      };
    } catch (err) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Token refresh failed',
      });

      return { success: false };
    }
  }

  private hashToken(token: string): string {
    return require('crypto').createHash('sha256').update(token).digest('hex');
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
    req?: Request,
    expiresIn: StringValue = '1d', 
  ): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const expiresMs = ms(expiresIn);

    const expiresAt = new Date(Date.now() + expiresMs);
    const ipAddress = req ? this.getClientIP(req) : '';
    const userAgent = req?.headers['user-agent'] || '';

    await this.refreshTokenRepo.update(
      { userId, ipAddress, userAgent, isRevoked: false },
      { isRevoked: true },
    );

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
    user: User,
    req: AuthenticatedRequest,
    options?: { loginType?: boolean },
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    const workspace = req.workspace;


    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        workspaceId: workspace,
        isActive: user.isActive,
        iat: Math.floor(Date.now() / 1000),
      },
      {
        expiresIn: appConfig.jwt.duration10m as StringValue,
        secret: appConfig.jwt.access_token_secret,
      },
    );

    let refreshToken: string | undefined;

    if (options?.loginType) {
      const refreshExpiresIn = appConfig.jwt.duration7d;

      refreshToken = this.jwtService.sign(
        {
          sub: user.id,
          type: 'refresh',
          iat: Math.floor(Date.now() / 1000),
        },
        {
          expiresIn: refreshExpiresIn as StringValue,
          secret: appConfig.jwt.refresh_token_secret,
        },
      );

      await this.storeRefreshToken(
        user.id,
        refreshToken,
        req,
        refreshExpiresIn as StringValue,
      );
    }

    return { accessToken, refreshToken };
  }
  // For initial login (no workspace)
  public async signGlobalTokens(
    user: User,
    req: Request,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'global', // No workspace context
        isActive: user.isActive,
        iat: Math.floor(Date.now() / 1000),
      },
      {
        expiresIn: appConfig.jwt.duration10m as StringValue, // Short-lived global token
        secret: appConfig.jwt.access_token_secret,
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
      },
      {
        expiresIn: appConfig.jwt.duration7d as StringValue,
        secret: appConfig.jwt.refresh_token_secret,
      },
    );

    await this.storeRefreshToken(user.id, refreshToken, req);

    return { accessToken, refreshToken };
  }

  public signWorkspaceToken(
    user: User,
    workspaceId: string,
    member: WorkspaceMember,
  ): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        workspaceId: workspaceId,
        memberId: member.id,
        role: member.role,
        type: 'workspace', // Workspace-scoped
        isActive: user.isActive,
        iat: Math.floor(Date.now() / 1000),
      },
      {
        expiresIn: appConfig.jwt.duration10m as StringValue,
        secret: appConfig.jwt.access_token_secret,
      },
    );
  }

  /**
   * Revoke refresh token(s) for a user
   * @param userId - User ID
   * @param refreshToken - Optional specific refresh token to revoke. If not provided, revokes all user's tokens
   * @param req - Optional request object to match IP and user agent
   */
  public async revokeRefreshToken(
    userId: string,
    refreshToken?: string,
    req?: Request,
  ): Promise<{ revokedCount: number }> {
    try {
      if (refreshToken) {
        const tokenHash = this.hashToken(refreshToken);
        const result = await this.refreshTokenRepo.update(
          {
            userId,
            tokenHash,
            isRevoked: false,
          },
          { isRevoked: true },
        );

        this.logger.log(`Revoked specific refresh token for user ${userId}`);
        return { revokedCount: result.affected || 0 };
      } else {
        // Revoke all active refresh tokens for the user
        // Optionally match IP and user agent for more targeted revocation
        const whereClause: any = {
          userId,
          isRevoked: false,
        };

        if (req) {
          const ipAddress = this.getClientIP(req);
          const userAgent = req.headers['user-agent'] || '';
          whereClause.ipAddress = ipAddress;
          whereClause.userAgent = userAgent;
        }

        const result = await this.refreshTokenRepo.update(whereClause, {
          isRevoked: true,
        });

        this.logger.log(
          `Revoked ${result.affected || 0} refresh token(s) for user ${userId}`,
        );
        return { revokedCount: result.affected || 0 };
      }
    } catch (error) {
      this.logger.error(
        `Failed to revoke refresh token for user ${userId}:`,
        error,
      );
      throw customError.internalServerError('Failed to revoke tokens');
    }
  }

  public async revokeAllRefreshTokens(userId: string): Promise<{ revokedCount: number }> {
    try {
      const result = await this.refreshTokenRepo.update(
        {
          userId,
          isRevoked: false,
        },
        { isRevoked: true },
      );

      this.logger.log(
        `Revoked all ${result.affected || 0} refresh token(s) for user ${userId}`,
      );
      return { revokedCount: result.affected || 0 };
    } catch (error) {
      this.logger.error(
        `Failed to revoke all refresh tokens for user ${userId}:`,
        error,
      );
      throw customError.internalServerError('Failed to revoke all tokens');
    }
  }
}
