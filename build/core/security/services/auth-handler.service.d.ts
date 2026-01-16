import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { TokenManager } from './token-manager.service';
import { User } from 'src/modules/users/entities/user.entity';
import { AuthDomainService } from './auth-domain.service';
export declare class AuthHandler {
    private readonly jwtService;
    private readonly tokenManager;
    private readonly authDomain;
    private readonly userRepo;
    private readonly logger;
    constructor(jwtService: JwtService, tokenManager: TokenManager, authDomain: AuthDomainService, userRepo: Repository<User>);
    authenticateToken(req: Request, res: Response): Promise<{
        success: boolean;
        user?: User;
    }>;
    private findUserById;
}
