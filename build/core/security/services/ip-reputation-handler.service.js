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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpReputationHandler = void 0;
const common_1 = require("@nestjs/common");
const attack_detector_service_1 = require("./attack-detector.service");
let IpReputationHandler = class IpReputationHandler {
    attackDetector;
    suspiciousIPs = new Set();
    constructor(attackDetector) {
        this.attackDetector = attackDetector;
    }
    checkIPReputation(req, res) {
        const clientIP = this.getClientIP(req);
        if (this.suspiciousIPs.has(clientIP)) {
            const userAgent = req.headers['user-agent'];
            if (this.isSuspiciousUserAgent(userAgent || '')) {
                res.status(common_1.HttpStatus.FORBIDDEN).json({
                    success: false,
                    message: 'Access denied',
                    timestamp: new Date().toISOString(),
                });
                return false;
            }
        }
        if (this.attackDetector.detectAttackPatterns(req)) {
            this.suspiciousIPs.add(clientIP);
            res.status(common_1.HttpStatus.FORBIDDEN).json({
                success: false,
                message: 'Malicious request detected',
                timestamp: new Date().toISOString(),
            });
            return false;
        }
        return true;
    }
    getClientIP(req) {
        const xfwd = req.headers['x-forwarded-for']
            ?.split(',')[0]
            ?.trim();
        const xreal = req.headers['x-real-ip']?.trim();
        const conn = req.connection?.remoteAddress;
        const sock = req.socket?.remoteAddress;
        return xfwd || xreal || conn || sock || '127.0.0.1';
    }
    isSuspiciousUserAgent(userAgent) {
        if (!userAgent)
            return true;
        const suspiciousPatterns = [
            /bot/i,
            /crawler/i,
            /spider/i,
            /scraper/i,
            /curl/i,
            /wget/i,
            /python/i,
            /java\b/i,
            /nmap/i,
            /sqlmap/i,
            /nikto/i,
        ];
        return suspiciousPatterns.some((pattern) => pattern.test(userAgent));
    }
};
exports.IpReputationHandler = IpReputationHandler;
exports.IpReputationHandler = IpReputationHandler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [attack_detector_service_1.AttackDetector])
], IpReputationHandler);
//# sourceMappingURL=ip-reputation-handler.service.js.map