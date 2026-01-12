import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SecurityModule } from 'src/core/security/security.module';
import { WorkspaceModule } from '../workspaces/workspace.module';
import { MemberModule } from '../members/member.module';
import { UserModule } from '../users/user.module';

import { AuthService } from './auth.service';
import { EmailService } from 'src/core/email/services/email.service';

import { AuthController } from './auth.controller';

import { User } from 'src/modules/users/entities/user.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User,Workspace]), 
    SecurityModule,
    WorkspaceModule,
    MemberModule,
    UserModule, 
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService],
  exports: [AuthService],
})
export class AuthModule {}
