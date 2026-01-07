import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SecurityModule } from 'src/core/security/security.module';
import { WorkspaceModule } from '../workspaces/workspace.module';
import { MemberModule } from '../members/member.module';
import { UserModule } from '../users/user.module';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { User } from 'src/modules/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), 
    SecurityModule,
    WorkspaceModule,
    MemberModule,
    UserModule, 
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
