"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WorkspaceMemberGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceMemberGuard = void 0;
const common_1 = require("@nestjs/common");
const custom_errors_1 = require("../../error-handler/custom-errors");
let WorkspaceMemberGuard = WorkspaceMemberGuard_1 = class WorkspaceMemberGuard {
    logger = new common_1.Logger(WorkspaceMemberGuard_1.name);
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const workspace = request.workspace;
        const member = request.workspaceMember;
        if (!user || !workspace) {
            throw custom_errors_1.customError.forbidden('Authentication and workspace required');
        }
        if (!member) {
            this.logger.warn(`User ${user.id} is not a member of workspace ${workspace.id}`);
            throw custom_errors_1.customError.forbidden('You are not a member of this workspace');
        }
        if (!member.is_active) {
            this.logger.warn(`User ${user.id} membership is inactive in workspace ${workspace.id}`);
            throw custom_errors_1.customError.forbidden('Your workspace membership is inactive');
        }
        this.logger.debug(`✅ Workspace member guard passed: User ${user.id} in workspace ${workspace.slug}`);
        return true;
    }
};
exports.WorkspaceMemberGuard = WorkspaceMemberGuard;
exports.WorkspaceMemberGuard = WorkspaceMemberGuard = WorkspaceMemberGuard_1 = __decorate([
    (0, common_1.Injectable)()
], WorkspaceMemberGuard);
//# sourceMappingURL=workspace-member.guard.js.map