import { Module, forwardRef } from '@nestjs/common';
import { MessagingGateway } from './gateways/messaging.gateway';
import { MessageService } from './services/message.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { WorkspaceModule } from '../workspaces/workspace.module';
import { MemberModule } from '../members/member.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN', '1h') ||
            '1h') as StringValue,
        },
      }),
    }),
    forwardRef(() => WorkspaceModule),
    forwardRef(() => MemberModule),
  ],
  providers: [MessagingGateway, MessageService],
  exports: [MessagingGateway, MessageService],
})
export class MessageModule {}
