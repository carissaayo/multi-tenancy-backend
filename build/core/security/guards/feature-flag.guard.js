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
var FeatureFlagGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagGuard = exports.RequireFeature = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const custom_errors_1 = require("../../error-handler/custom-errors");
const RequireFeature = (featureKey) => (0, common_1.SetMetadata)('feature-flag', featureKey);
exports.RequireFeature = RequireFeature;
let FeatureFlagGuard = FeatureFlagGuard_1 = class FeatureFlagGuard {
    reflector;
    logger = new common_1.Logger(FeatureFlagGuard_1.name);
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const featureKey = this.reflector.get('feature-flag', context.getHandler());
        if (!featureKey) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const workspace = request.workspace;
        if (!workspace) {
            throw custom_errors_1.customError.forbidden('Workspace context required');
        }
        const hasFeature = workspace.features?.includes(featureKey);
        if (!hasFeature) {
            this.logger.warn(`Feature '${featureKey}' not available for workspace ${workspace.slug}`);
            throw custom_errors_1.customError.forbidden(`This feature is not available on your current plan`);
        }
        this.logger.debug(`✅ Feature flag guard passed: ${featureKey}`);
        return true;
    }
};
exports.FeatureFlagGuard = FeatureFlagGuard;
exports.FeatureFlagGuard = FeatureFlagGuard = FeatureFlagGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], FeatureFlagGuard);
//# sourceMappingURL=feature-flag.guard.js.map