"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WsAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const auth_domain_service_1 = require("../../../core/security/services/auth-domain.service");
let WsAuthGuard = WsAuthGuard_1 = class WsAuthGuard {
    authDomain;
    logger = new common_1.Logger(WsAuthGuard_1.name);
    constructor(authDomain) {
        this.authDomain = authDomain;
    }
    async canActivate(context) {
        try {
            const client = context.switchToWs().getClient();
            const token = this.extractToken(client);
            if (!token) {
                throw new websockets_1.WsException('Unauthorized: No token provided');
            }
            const auth = await this.authDomain.validateAccessToken(token);
            client.userId = auth.userId;
            client.workspaceId = auth.workspaceId;
            return true;
        }
        catch (error) {
            this.logger.error('WebSocket authentication failed:', error);
            throw new websockets_1.WsException('Unauthorized');
        }
    }
    extractToken(client) {
        if (client.handshake.auth?.token) {
            return client.handshake.auth.token;
        }
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return null;
    }
};
exports.WsAuthGuard = WsAuthGuard;
exports.WsAuthGuard = WsAuthGuard = WsAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_domain_service_1.AuthDomainService])
], WsAuthGuard);
//# sourceMappingURL=ws-auth.guard.js.map