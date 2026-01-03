import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SecurityModule } from 'src/core/security/security.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { User } from 'src/modules/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User]), SecurityModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
