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
var CorsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorsHandler = void 0;
const common_1 = require("@nestjs/common");
let CorsHandler = CorsHandler_1 = class CorsHandler {
    allowedOrigins = (() => {
        const origins = [];
        origins.push('http://localhost:3000');
        if (process.env.FRONTEND_URL) {
            const frontendUrl = process.env.FRONTEND_URL.trim().replace(/\/$/, '');
            if (frontendUrl) {
                origins.push(frontendUrl);
            }
        }
        if (process.env.ALLOWED_ORIGINS) {
            const additionalOrigins = process.env.ALLOWED_ORIGINS
                .split(',')
                .map(origin => origin.trim().replace(/\/$/, ''))
                .filter(origin => origin.length > 0);
            origins.push(...additionalOrigins);
        }
        return [...new Set(origins)];
    })();
    logger = new common_1.Logger(CorsHandler_1.name);
    constructor() {
        this.logger.log(`CORS enabled for origins: ${JSON.stringify(this.allowedOrigins)}`);
    }
    handleCORS(req, res) {
        const origin = req.headers.origin;
        const method = req.method;
        if (method === 'OPTIONS') {
            if (origin && this.allowedOrigins.includes(origin)) {
                res.setHeader('Access-Control-Allow-Origin', origin);
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-API-Key, x-workspace-slug, refreshtoken');
                res.setHeader('Access-Control-Expose-Headers', 'X-New-Access-Token, Authorization');
                res.setHeader('Access-Control-Allow-Credentials', 'true');
                res.setHeader('Access-Control-Max-Age', '86400');
            }
            else {
                this.logger.warn(`CORS blocked OPTIONS request from origin: ${origin}. Allowed origins: ${JSON.stringify(this.allowedOrigins)}`);
            }
            res.status(204).end();
            return false;
        }
        if (origin && this.allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }
        else if (origin) {
            this.logger.warn(`CORS blocked ${method} request from origin: ${origin}. Allowed origins: ${JSON.stringify(this.allowedOrigins)}`);
        }
        return true;
    }
};
exports.CorsHandler = CorsHandler;
exports.CorsHandler = CorsHandler = CorsHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CorsHandler);
//# sourceMappingURL=cors-handler.service.js.map