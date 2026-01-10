import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './services/user.service';
import { SecurityModule } from 'src/core/security/security.module';
import { UsersController } from './controllers/user.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), SecurityModule
],
  providers: [UsersService],
  controllers:[UsersController],
  exports: [UsersService],
})
export class UserModule {}
