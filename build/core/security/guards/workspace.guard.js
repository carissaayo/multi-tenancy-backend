"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WorkspaceGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceGuard = exports.Workspace = void 0;
const common_1 = require("@nestjs/common");
const custom_errors_1 = require("../../error-handler/custom-errors");
exports.Workspace = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.workspace;
});
let WorkspaceGuard = WorkspaceGuard_1 = class WorkspaceGuard {
    logger = new common_1.Logger(WorkspaceGuard_1.name);
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const workspace = request.workspace;
        if (!workspace) {
            this.logger.error('No workspace found in request');
            throw custom_errors_1.customError.forbidden('Workspace context required');
        }
        if (!workspace.is_active) {
            this.logger.warn(`Workspace ${workspace.id} is inactive`);
            throw custom_errors_1.customError.forbidden('Workspace is not active');
        }
        this.logger.debug(`✅ Workspace guard passed: ${workspace.slug}`);
        return true;
    }
};
exports.WorkspaceGuard = WorkspaceGuard;
exports.WorkspaceGuard = WorkspaceGuard = WorkspaceGuard_1 = __decorate([
    (0, common_1.Injectable)()
], WorkspaceGuard);
//# sourceMappingURL=workspace.guard.js.map