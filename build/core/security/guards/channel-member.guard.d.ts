import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare const RequireChannelMembership: () => import("@nestjs/common").CustomDecorator<string>;
export declare class ChannelMemberGuard implements CanActivate {
    private readonly logger;
    canActivate(context: ExecutionContext): boolean;
}
