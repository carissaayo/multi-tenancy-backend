import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SecurityModule } from 'src/core/security/security.module';
import { UserModule } from '../users/user.module';
import { MemberModule } from '../members/member.module';

import { WorkspacesService } from './services/workspace.service';
import { WorkspaceQueryService } from './services/workspace-query.service';
import { WorkspaceMembershipService } from './services/workspace-membership.service';
import { WorkspaceInviteService } from './services/workspace-invite.service';
import { WorkspaceLifecycleService } from './services/workspace-lifecycle.service';
import { AWSStorageService } from 'src/core/storage/services/aws-storage.service';

import { WorkspacesController } from './controllers/workspace.controller';

import { Workspace } from './entities/workspace.entity';
import { User } from '../users/entities/user.entity';
import { WorkspaceInvitation } from './entities/workspace_initations.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, User, WorkspaceInvitation]),
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
    AWSStorageService,
  ],
  controllers: [WorkspacesController],
  exports: [WorkspacesService],
})
export class WorkspaceModule {}
