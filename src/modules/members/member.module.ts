import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberService } from './services/member.service';
import { Workspace } from '../workspaces//entities/workspace.entity';
import { WorkspaceModule } from '../workspaces/workspace.module';
@Module({
  imports: [TypeOrmModule.forFeature([Workspace]), WorkspaceModule     ],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
