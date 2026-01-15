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
var ResourceOwnerGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceOwnerGuard = exports.RequireOwnership = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const custom_errors_1 = require("../../error-handler/custom-errors");
const RequireOwnership = (resourceField = 'created_by') => (0, common_1.SetMetadata)('resource-ownership', resourceField);
exports.RequireOwnership = RequireOwnership;
let ResourceOwnerGuard = ResourceOwnerGuard_1 = class ResourceOwnerGuard {
    reflector;
    logger = new common_1.Logger(ResourceOwnerGuard_1.name);
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const resourceField = this.reflector.get('resource-ownership', context.getHandler());
        if (!resourceField) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const resource = request.resource;
        if (!resource) {
            throw custom_errors_1.customError.forbidden('Resource not found');
        }
        const resourceOwnerId = resource[resourceField] || resource.member_id;
        if (resourceOwnerId !== user.id) {
            this.logger.warn(`Ownership denied: User ${user.id} is not owner of resource`);
            throw custom_errors_1.customError.forbidden('You can only modify your own resources');
        }
        this.logger.debug(`✅ Resource owner guard passed`);
        return true;
    }
};
exports.ResourceOwnerGuard = ResourceOwnerGuard;
exports.ResourceOwnerGuard = ResourceOwnerGuard = ResourceOwnerGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], ResourceOwnerGuard);
//# sourceMappingURL=resource-owner.guard.js.map