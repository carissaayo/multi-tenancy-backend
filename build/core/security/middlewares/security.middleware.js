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
var SecurityMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityMiddleware = void 0;
const common_1 = require("@nestjs/common");
const cors_handler_service_1 = require("../services/cors-handler.service");
const rate_limit_handler_service_1 = require("../services/rate-limit-handler.service");
const ip_reputation_handler_service_1 = require("../services/ip-reputation-handler.service");
const input_sanitizer_service_1 = require("../services/input-sanitizer.service");
const auth_handler_service_1 = require("../services/auth-handler.service");
const response_monitor_service_1 = require("../services/response-monitor.service");
const public_routes_1 = require("../constants/public-routes");
let SecurityMiddleware = SecurityMiddleware_1 = class SecurityMiddleware {
    corsHandler;
    rateLimitHandler;
    ipReputationHandler;
    inputSanitizer;
    authHandler;
    responseMonitor;
    logger = new common_1.Logger(SecurityMiddleware_1.name);
    constructor(corsHandler, rateLimitHandler, ipReputationHandler, inputSanitizer, authHandler, responseMonitor) {
        this.corsHandler = corsHandler;
        this.rateLimitHandler = rateLimitHandler;
        this.ipReputationHandler = ipReputationHandler;
        this.inputSanitizer = inputSanitizer;
        this.authHandler = authHandler;
        this.responseMonitor = responseMonitor;
    }
    async use(req, res, next) {
        const startTime = Date.now();
        try {
            this.logger.debug(`SecurityMiddleware: incoming request → path="${req.path}", originalUrl="${req.originalUrl}"`);
            this.applySecurityHeaders(req, res);
            if (!this.corsHandler.handleCORS(req, res))
                return;
            if (!(await this.rateLimitHandler.checkRateLimit(req, res)))
                return;
            if (!this.ipReputationHandler.checkIPReputation(req, res))
                return;
            this.inputSanitizer.sanitizeInput(req, res);
            this.applyCSP(res);
            if (!this.isPublicRoute(req.originalUrl)) {
                const authResult = await this.authHandler.authenticateToken(req, res);
                if (!authResult.success)
                    return;
                console.log(authResult);
                req.user = authResult.user;
                req.userId = String(authResult.user?.id);
            }
            this.responseMonitor.monitorResponse(req, res, startTime);
            return next();
        }
        catch (error) {
            this.logger.error(`Security middleware error: ${error?.message}`, error?.stack);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Security check failed',
                timestamp: new Date().toISOString(),
            });
        }
    }
    applySecurityHeaders(_req, res) {
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        res.setHeader('X-Request-ID', this.generateRequestId());
        res.setHeader('X-Timestamp', Date.now().toString());
    }
    applyCSP(res) {
        const csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https:",
            "connect-src 'self' https://api.yourdomain.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join('; ');
        res.setHeader('Content-Security-Policy', csp);
    }
    isPublicRoute(path) {
        return public_routes_1.publicRoutes.some((route) => {
            const regex = new RegExp('^' + route.replace(/:[^/]+/g, '[^/]+') + '$');
            return regex.test(path);
        });
    }
    generateRequestId() {
        return require('crypto').randomBytes(16).toString('hex');
    }
};
exports.SecurityMiddleware = SecurityMiddleware;
exports.SecurityMiddleware = SecurityMiddleware = SecurityMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cors_handler_service_1.CorsHandler,
        rate_limit_handler_service_1.RateLimitHandler,
        ip_reputation_handler_service_1.IpReputationHandler,
        input_sanitizer_service_1.InputSanitizer,
        auth_handler_service_1.AuthHandler,
        response_monitor_service_1.ResponseMonitor])
], SecurityMiddleware);
//# sourceMappingURL=security.middleware.js.map