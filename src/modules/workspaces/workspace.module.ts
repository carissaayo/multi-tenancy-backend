import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';
import { WorkspacesService } from './services/workspace.service';
import { WorkspacesController } from './controllers/workspace.controller';
import { SecurityModule } from 'src/core/security/security.module';
import { UserModule } from '../users/user.module';
import { MemberModule } from '../members/member.module';
import { AWSStorageService } from 'src/core/storage/services/aws-storage.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace]),
    SecurityModule,
    UserModule,
    forwardRef(() => MemberModule),
  ],
  providers: [WorkspacesService,AWSStorageService],
  controllers: [WorkspacesController],
  exports: [WorkspacesService],
})
export class WorkspaceModule {}
