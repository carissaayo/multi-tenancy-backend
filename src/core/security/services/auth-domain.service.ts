import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

import { User } from 'src/modules/users/entities/user.entity';
import config from 'src/config/config';

const appConfig = config();

@Injectable()
export class AuthDomainService {
  private readonly logger = new Logger(AuthDomainService.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  async validateAccessToken(token: string): Promise<{
    user: User;
    userId: string;
    workspaceId?: string;
  }> {
    let payload: { sub: string; workspaceId?: string };

    try {
      payload = this.jwtService.verify(token, {
        secret: appConfig.jwt.access_token_secret,
      }) as {
        sub: string;
        workspaceId?: string;
      };
    } catch (error) {
      // Re-throw TokenExpiredError so it can be caught and handled for refresh
      if (error instanceof TokenExpiredError) {
        this.logger.warn('Token expired');
        throw error; // Re-throw the original TokenExpiredError
      }
      if (error instanceof JsonWebTokenError) {
        this.logger.warn('Invalid token format');
        throw new UnauthorizedException('Invalid token');
      }
      this.logger.error('JWT verification error:', error);
      throw new UnauthorizedException('Token verification failed');
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub, isActive: true },
    });

    if (!user) {
      this.logger.warn(`Invalid or inactive user: ${payload.sub}`);
      throw new UnauthorizedException('Invalid or inactive user');
    }

    return {
      user,
      userId: user.id,
      workspaceId: payload.workspaceId,
    };
  }
}