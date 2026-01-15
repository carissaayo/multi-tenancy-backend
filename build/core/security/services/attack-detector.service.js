"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttackDetector = void 0;
const common_1 = require("@nestjs/common");
let AttackDetector = class AttackDetector {
    attackPatterns = [
        /(\bor\b|\band\b).*['"].*['"]/,
        /union.*select/,
        /insert.*into/,
        /delete.*from/,
        /<script\b/,
        /javascript:/,
        /onerror\s*=/,
        /onload\s*=/,
        /\.\.\//,
        /\.\.\\/,
        /etc\/passwd/,
        /windows\/system32/,
        /;\s*(ls|cat|wget|curl|nc|netcat)/,
        /`.*`/,
        /\$\(.*\)/,
        /\$where/,
        /\$ne/,
        /\$regex/,
        /\$gt/,
        /\$lt/,
    ];
    detectAttackPatterns(req) {
        const url = (req.originalUrl || req.url || '').toLowerCase();
        const bodyObj = req.body && typeof req.body === 'object' ? req.body : {};
        const query = JSON.stringify(req.query || {}).toLowerCase();
        if (this.containsKeyDeep(bodyObj, 'applicationFields')) {
            console.log("AttackDetector: Skipping scan because 'applicationFields' found");
            return false;
        }
        const bodyStr = JSON.stringify(bodyObj || {}).toLowerCase();
        const content = `${url} ${bodyStr} ${query}`;
        return this.attackPatterns.some((pattern) => pattern.test(content));
    }
    containsKeyDeep(obj, targetKey) {
        if (!obj || typeof obj !== 'object')
            return false;
        if (Object.prototype.hasOwnProperty.call(obj, targetKey)) {
            return true;
        }
        return Object.values(obj).some((val) => this.containsKeyDeep(val, targetKey));
    }
};
exports.AttackDetector = AttackDetector;
exports.AttackDetector = AttackDetector = __decorate([
    (0, common_1.Injectable)()
], AttackDetector);
//# sourceMappingURL=attack-detector.service.js.map