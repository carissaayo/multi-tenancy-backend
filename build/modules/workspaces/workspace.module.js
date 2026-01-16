"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const security_module_1 = require("../../core/security/security.module");
const user_module_1 = require("../users/user.module");
const member_module_1 = require("../members/member.module");
const message_module_1 = require("../messages/message.module");
const workspace_service_1 = require("./services/workspace.service");
const workspace_query_service_1 = require("./services/workspace-query.service");
const workspace_membership_service_1 = require("./services/workspace-membership.service");
const workspace_invite_service_1 = require("./services/workspace-invite.service");
const workspace_lifecycle_service_1 = require("./services/workspace-lifecycle.service");
const aws_storage_service_1 = require("../../core/storage/services/aws-storage.service");
const email_service_1 = require("../../core/email/services/email.service");
const workspace_invite_controller_1 = require("./controllers/workspace-invite.controller");
const workspace_controller_1 = require("./controllers/workspace.controller");
const workspace_entity_1 = require("./entities/workspace.entity");
const user_entity_1 = require("../users/entities/user.entity");
const workspace_initations_entity_1 = require("./entities/workspace_initations.entity");
const workspace_management_service_1 = require("./services/workspace-management.service");
const workspace_management_controller_1 = require("./controllers/workspace-management.controller");
const workspace_setting_service_1 = require("./services/workspace-setting.service");
const workspace_settings_controller_1 = require("./controllers/workspace-settings.controller");
const workspace_member_decorator_1 = require("../../core/security/decorators/workspace-member.decorator");
let WorkspaceModule = class WorkspaceModule {
};
exports.WorkspaceModule = WorkspaceModule;
exports.WorkspaceModule = WorkspaceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forFeature([
                workspace_entity_1.Workspace,
                user_entity_1.User,
                workspace_initations_entity_1.WorkspaceInvitation,
                workspace_member_decorator_1.WorkspaceMember,
            ]),
            security_module_1.SecurityModule,
            user_module_1.UserModule,
            (0, common_1.forwardRef)(() => member_module_1.MemberModule),
            (0, common_1.forwardRef)(() => message_module_1.MessageModule),
        ],
        providers: [
            workspace_service_1.WorkspacesService,
            workspace_query_service_1.WorkspaceQueryService,
            workspace_membership_service_1.WorkspaceMembershipService,
            workspace_lifecycle_service_1.WorkspaceLifecycleService,
            workspace_invite_service_1.WorkspaceInviteService,
            workspace_management_service_1.WorkspaceManagementService,
            workspace_setting_service_1.WorkspaceSettingService,
            aws_storage_service_1.AWSStorageService,
            email_service_1.EmailService,
        ],
        controllers: [
            workspace_controller_1.WorkspacesController,
            workspace_invite_controller_1.WorkspaceInviteController,
            workspace_management_controller_1.WorkspaceManagementController,
            workspace_settings_controller_1.WorkspaceSettingsController,
        ],
        exports: [workspace_service_1.WorkspacesService],
    })
], WorkspaceModule);
//# sourceMappingURL=workspace.module.js.map