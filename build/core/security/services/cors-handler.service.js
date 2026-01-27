"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorsHandler = void 0;
const common_1 = require("@nestjs/common");
let CorsHandler = class CorsHandler {
    allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
    ];
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
            res.status(204).end();
            return false;
        }
        if (origin && this.allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }
        return true;
    }
};
exports.CorsHandler = CorsHandler;
exports.CorsHandler = CorsHandler = __decorate([
    (0, common_1.Injectable)()
], CorsHandler);
//# sourceMappingURL=cors-handler.service.js.map