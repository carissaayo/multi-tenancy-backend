import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import ms, { StringValue } from 'ms';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
// import { RedisRateLimiter } from './radis-rate-limiter.service';
// import { SecurityLogger } from './security.logger.service';

import { AuthResult } from '../interfaces/security.interface';

import { AuthenticatedRequest } from '../interfaces/custom-request.interface';

import config from 'src/config/config';
import { User } from 'src/modules/users/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { customError } from 'src/core/error-handler/custom-errors';
import { WorkspaceMember } from 'src/modules/members/entities/member.entity';

const appConfig = config();

@Injectable()
export class TokenManager {
  private readonly logger = new Logger(TokenManager.name);

  constructor(
    private readonly jwtService: JwtService,
    // private readonly securityLogger: SecurityLogger,

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
  ): Promise<AuthResult> {
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

      // ⛔ Do NOT issue workspace-scoped token here
      // Client must reselect workspace

      return { success: true, user };
    } catch (err) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Token refresh failed',
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
    refreshToken: string,
    req?: Request,
    expiresIn: StringValue = '7d',
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
    const member = req.workspaceMember;
    const memberRole = req.workspaceMemberRole;
    // if (!workspace || !member) {
    //   throw customError.badRequest(
    //     'Workspace context required to issue access token',
    //   );
    // }

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        workspaceId: workspace,
        // memberId: member,
        // role: memberRole,
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

  // For workspace selection (workspace-scoped)
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
}
