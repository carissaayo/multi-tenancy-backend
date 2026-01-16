import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthDomainService } from 'src/core/security/services/auth-domain.service';
export declare class WsAuthGuard implements CanActivate {
    private readonly authDomain;
    private readonly logger;
    constructor(authDomain: AuthDomainService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractToken;
}
