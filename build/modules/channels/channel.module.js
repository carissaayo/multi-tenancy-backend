"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const member_module_1 = require("../members/member.module");
const workspace_module_1 = require("../workspaces/workspace.module");
const security_module_1 = require("../../core/security/security.module");
const message_module_1 = require("../messages/message.module");
const channel_service_1 = require("./services/channel.service");
const channel_lifecycle_service_1 = require("./services/channel-lifecycle.service");
const channel_membership_service_1 = require("./services/channel-membership.service");
const channel_query_service_1 = require("./services/channel-query.service");
const channel_management_service_1 = require("./services/channel-management.service");
const channel_invite_service_1 = require("./services/channel-invite.service");
const email_service_1 = require("../../core/email/services/email.service");
const channel_controller_1 = require("./controllers/channel.controller");
const channel_management_controller_1 = require("./controllers/channel-management.controller");
const channel_membership_controller_1 = require("./controllers/channel-membership.controller");
const channel_invite_controller_1 = require("./controllers/channel-invite.controller");
const channel_entity_1 = require("./entities/channel.entity");
const channel_member_entity_1 = require("./entities/channel-member.entity");
const channel_invitations_entity_1 = require("./entities/channel_invitations.entity");
let ChannelModule = class ChannelModule {
};
exports.ChannelModule = ChannelModule;
exports.ChannelModule = ChannelModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                channel_entity_1.ChannelEntity,
                channel_member_entity_1.ChannelMemberEntity,
                channel_invitations_entity_1.ChannelInvitation,
            ]),
            member_module_1.MemberModule,
            workspace_module_1.WorkspaceModule,
            security_module_1.SecurityModule,
            (0, common_1.forwardRef)(() => message_module_1.MessageModule),
        ],
        controllers: [
            channel_controller_1.ChannelController,
            channel_management_controller_1.ChannelManagementController,
            channel_membership_controller_1.ChannelMembershipController,
            channel_invite_controller_1.ChannelInviteController,
        ],
        providers: [
            channel_service_1.ChannelService,
            channel_lifecycle_service_1.ChannelLifecycleService,
            channel_membership_service_1.ChannelMembershipService,
            channel_query_service_1.ChannelQueryService,
            channel_management_service_1.ChannelManagementService,
            channel_invite_service_1.ChannelInviteService,
            email_service_1.EmailService,
        ],
        exports: [channel_service_1.ChannelService],
    })
], ChannelModule);
//# sourceMappingURL=channel.module.js.map