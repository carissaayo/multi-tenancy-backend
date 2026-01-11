import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SecurityModule } from 'src/core/security/security.module';
import { UsersService } from './services/user.service';
import { AWSStorageService } from 'src/core/storage/services/aws-storage.service';

import { UsersController } from './controllers/user.controller';

import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User]), SecurityModule],
  providers: [UsersService, AWSStorageService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UserModule {}
