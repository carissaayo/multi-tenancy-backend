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
var PermissionGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionGuard = exports.CurrentUser = exports.RequireAllPermissions = exports.RequirePermissions = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const custom_errors_1 = require("../../error-handler/custom-errors");
const RequirePermissions = (...permissions) => (0, common_1.SetMetadata)('permissions', permissions);
exports.RequirePermissions = RequirePermissions;
const RequireAllPermissions = (...permissions) => (0, common_1.SetMetadata)('all-permissions', permissions);
exports.RequireAllPermissions = RequireAllPermissions;
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
let PermissionGuard = PermissionGuard_1 = class PermissionGuard {
    reflector;
    logger = new common_1.Logger(PermissionGuard_1.name);
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredPermissions = this.reflector.getAllAndOverride('permissions', [context.getHandler(), context.getClass()]);
        const requiredAllPermissions = this.reflector.getAllAndOverride('all-permissions', [context.getHandler(), context.getClass()]);
        if (!requiredPermissions && !requiredAllPermissions) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.UnauthorizedException('Authentication required');
        }
        const userPermissions = user.permissions || [];
        if (requiredPermissions) {
            const hasAnyPermission = requiredPermissions.some((permission) => userPermissions.includes(permission));
            if (!hasAnyPermission) {
                this.logger.warn(`Permission denied: User ${user.id} lacks any of [${requiredPermissions.join(', ')}]`);
                throw custom_errors_1.customError.forbidden('You do not have the required permissions');
            }
        }
        if (requiredAllPermissions) {
            const hasAllPermissions = requiredAllPermissions.every((permission) => userPermissions.includes(permission));
            if (!hasAllPermissions) {
                this.logger.warn(`Permission denied: User ${user.id} lacks all of [${requiredAllPermissions.join(', ')}]`);
                throw custom_errors_1.customError.forbidden('Insufficient permissions');
            }
        }
        this.logger.debug(`✅ Permission check passed for user ${user.id}`);
        return true;
    }
};
exports.PermissionGuard = PermissionGuard;
exports.PermissionGuard = PermissionGuard = PermissionGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], PermissionGuard);
//# sourceMappingURL=permissions.guard.js.map