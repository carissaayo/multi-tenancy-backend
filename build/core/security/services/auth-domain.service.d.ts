import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
export declare class AuthDomainService {
    private readonly jwtService;
    private readonly userRepo;
    private readonly logger;
    constructor(jwtService: JwtService, userRepo: Repository<User>);
    validateAccessToken(token: string): Promise<{
        user: User;
        userId: string;
        workspaceId?: string;
    }>;
}
