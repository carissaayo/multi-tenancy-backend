import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from './config/database.config';

import { DatabaseModule } from './core/database/database.module';
import { SecurityModule } from './core/security/security.module';
import appConfig from './config/config';
import { validateEnv } from './config/config.validation';
import { AuthModule } from './modules/auth/auth.module';
import { WorkspaceModule } from './modules/workspaces/workspace.module';
import { UserModule } from './modules/users/user.module';
import { ChannelModule } from './modules/channels/channel.module';
import { MessageModule } from './modules/messages/message.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig],
      validate: validateEnv,
    }),

    DatabaseModule,
    SecurityModule,
    AuthModule,
    UserModule,
    WorkspaceModule,
    ChannelModule,
    MessageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
