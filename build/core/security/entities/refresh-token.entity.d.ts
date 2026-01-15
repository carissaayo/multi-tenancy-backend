import { User } from '../../../modules/users/entities/user.entity';
export declare class RefreshToken {
    id: string;
    tokenHash: string;
    user: User;
    userId: string;
    expiresAt: Date;
    lastUsedAt: Date | null;
    isRevoked: boolean;
    revokedAt: Date | null;
    revokedReason: string | null;
    userAgent: string;
    ipAddress: string;
    version: number;
    createdAt: Date;
}
