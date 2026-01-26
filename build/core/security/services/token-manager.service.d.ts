import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AuthResult } from '../interfaces/security.interface';
import { AuthenticatedRequest } from '../interfaces/custom-request.interface';
import { User } from 'src/modules/users/entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { WorkspaceMember } from 'src/modules/members/entities/member.entity';
export declare class TokenManager {
    private readonly jwtService;
    private readonly userRepo;
    private readonly refreshTokenRepo;
    private readonly logger;
    constructor(jwtService: JwtService, userRepo: Repository<User>, refreshTokenRepo: Repository<RefreshToken>);
    handleTokenRefresh(req: Request, res: Response, expiredAccessToken: string, refreshToken: string): Promise<AuthResult & {
        accessToken?: string;
    }>;
    private hashToken;
    private storeRefreshToken;
    private getClientIP;
    signTokens(user: User, req: AuthenticatedRequest, options?: {
        loginType?: boolean;
    }): Promise<{
        accessToken: string;
        refreshToken?: string;
    }>;
    signGlobalTokens(user: User, req: Request): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    signWorkspaceToken(user: User, workspaceId: string, member: WorkspaceMember): string;
}
