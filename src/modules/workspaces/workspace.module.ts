import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { SecurityModule } from 'src/core/security/security.module';
import { UserModule } from '../users/user.module';
import { MemberModule } from '../members/member.module';

import { WorkspacesService } from './services/workspace.service';
import { WorkspaceQueryService } from './services/workspace-query.service';
import { WorkspaceMembershipService } from './services/workspace-membership.service';
import { WorkspaceInviteService } from './services/workspace-invite.service';
import { WorkspaceLifecycleService } from './services/workspace-lifecycle.service';
import { AWSStorageService } from 'src/core/storage/services/aws-storage.service';
import { EmailService } from 'src/core/email/services/email.service';

import { WorkspaceInviteController } from './controllers/workspace-invite.controller';
import { WorkspacesController } from './controllers/workspace.controller';

import { Workspace } from './entities/workspace.entity';
import { User } from '../users/entities/user.entity';
import { WorkspaceInvitation } from './entities/workspace_initations.entity';
import { WorkspaceManagementService } from './services/workspace-management.service';
import { WorkspaceManagementController } from './controllers/workspace-management.controller';
import { WorkspaceSettingService } from './services/workspace-setting.service';
import { WorkspaceSettingsController } from './controllers/workspace-settings.controller';
import { WorkspaceMember } from 'src/core/security/decorators/workspace-member.decorator';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forFeature([Workspace, User, WorkspaceInvitation,WorkspaceMember]),
    SecurityModule,
    UserModule,
    forwardRef(() => MemberModule),
  ],
  providers: [
    WorkspacesService,
    WorkspaceQueryService,
    WorkspaceMembershipService,
    WorkspaceLifecycleService,
    WorkspaceInviteService,
    WorkspaceManagementService,
    WorkspaceSettingService,
    AWSStorageService,
    EmailService,
  ],
  controllers: [
    WorkspacesController,
    WorkspaceInviteController,
    WorkspaceManagementController,
    WorkspaceSettingsController,
  ],
  exports: [WorkspacesService],
})
export class WorkspaceModule {}
