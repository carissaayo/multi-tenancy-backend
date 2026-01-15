"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputSanitizer = void 0;
const common_1 = require("@nestjs/common");
const xss_1 = __importDefault(require("xss"));
const hpp_1 = __importDefault(require("hpp"));
let InputSanitizer = class InputSanitizer {
    sanitizeInput(req, res) {
        if (req.body && typeof req.body === 'object') {
            req.body = this.sanitizeObject(req.body);
        }
        if (req.query && typeof req.query === 'object') {
            this.sanitizeObjectInPlace(req.query);
        }
        if (req.params && typeof req.params === 'object') {
            this.sanitizeObjectInPlace(req.params);
        }
        (0, hpp_1.default)()(req, res, () => { });
    }
    sanitizeObject(value) {
        if (Array.isArray(value)) {
            return value.map((item) => this.sanitizeObject(item));
        }
        if (value && typeof value === 'object') {
            const sanitized = {};
            for (const key of Object.keys(value)) {
                sanitized[key] = this.sanitizeObject(value[key]);
            }
            return sanitized;
        }
        if (typeof value === 'string') {
            return (0, xss_1.default)(value.trim());
        }
        return value;
    }
    sanitizeObjectInPlace(obj) {
        if (!obj || typeof obj !== 'object')
            return;
        for (const key of Object.keys(obj)) {
            const value = obj[key];
            if (typeof value === 'string') {
                obj[key] = (0, xss_1.default)(value.trim());
            }
            else if (Array.isArray(value)) {
                obj[key] = value.map((item) => typeof item === 'string' ? (0, xss_1.default)(item.trim()) : item);
            }
            else if (value && typeof value === 'object') {
                this.sanitizeObjectInPlace(value);
            }
        }
    }
};
exports.InputSanitizer = InputSanitizer;
exports.InputSanitizer = InputSanitizer = __decorate([
    (0, common_1.Injectable)()
], InputSanitizer);
//# sourceMappingURL=input-sanitizer.service.js.map