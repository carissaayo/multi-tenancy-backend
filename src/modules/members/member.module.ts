import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberService } from './services/member.service';
import { Workspace } from '../workspaces//entities/workspace.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace])],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
