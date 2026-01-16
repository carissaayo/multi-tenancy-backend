import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MemberModule } from "../members/member.module";
import { WorkspaceModule } from "../workspaces/workspace.module";
import { SecurityModule } from "src/core/security/security.module";
import { MessageModule } from "../messages/message.module";

import { ChannelService } from "./services/channel.service";
import { ChannelLifecycleService } from "./services/channel-lifecycle.service";
import { ChannelMembershipService } from "./services/channel-membership.service";
import { ChannelQueryService } from "./services/channel-query.service";
import { ChannelManagementService } from "./services/channel-management.service";
import { ChannelInviteService } from "./services/channel-invite.service";
import { EmailService } from "src/core/email/services/email.service";

import { ChannelController } from "./controllers/channel.controller";
import { ChannelManagementController } from "./controllers/channel-management.controller";
import { ChannelMembershipController } from "./controllers/channel-membership.controller";
import { ChannelInviteController } from "./controllers/channel-invite.controller";

import { ChannelEntity } from "./entities/channel.entity";
import { ChannelMemberEntity } from "./entities/channel-member.entity";
import { ChannelInvitation } from "./entities/channel_invitations.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChannelEntity,
      ChannelMemberEntity,
      ChannelInvitation,
    ]),
    MemberModule,
    WorkspaceModule,
    SecurityModule,
    forwardRef(() => MessageModule),
  ],
  controllers: [
    ChannelController,
    ChannelManagementController,
    ChannelMembershipController,
    ChannelInviteController,
  ],
  providers: [
    ChannelService,
    ChannelLifecycleService,
    ChannelMembershipService,
    ChannelQueryService,
    ChannelManagementService,
    ChannelInviteService,
    EmailService,
  ],
  exports: [ChannelService],
})
export class ChannelModule {}