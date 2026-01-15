import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';


// Public schema entities
import { User } from '../../modules/users/entities/user.entity';
import { Workspace } from '../../modules/workspaces/entities/workspace.entity';
import { FeatureFlag } from '../feature-flags/entities/feature-flag.entity';
import { UsageMetric } from '../usage/entities/usage.entity';
import { RefreshToken } from '../security/entities/refresh-token.entity';
import { WorkspaceInvitation } from 'src/modules/workspaces/entities/workspace_initations.entity';

// Tenant schema entities
import { WorkspaceMemberEntity } from 'src/modules/members/entities/member.entity';
import { ChannelEntity } from '../../modules/channels/entities/channel.entity';
import { ChannelMemberEntity } from '../../modules/channels/entities/channel-member.entity';
import { MessageEntity } from '../../modules/messages/entities/message.entity';
import { FileEntity } from '../../modules/files/entities/file.entity';
import { ReactionEntity } from 'src/modules/reactions/entities/reaction.entity';


@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProd = process.env.NODE_ENV === 'production';
        const databaseUrl = process.env.DATABASE_URL;

        const baseConfig = {
          entities: [
            User,
            Workspace,
            WorkspaceInvitation,
            FeatureFlag,
            UsageMetric,
            RefreshToken,
            WorkspaceMemberEntity,
            ChannelEntity,
            ChannelMemberEntity,
            MessageEntity,
            FileEntity,
            ReactionEntity,
          ],
          synchronize: false,
          logging: !isProd,
          migrationsRun: false,
          extra: {
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          },
        };

        if (isProd && databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            ssl: { rejectUnauthorized: false },
            ...baseConfig,
          };
        }

        return {
          ...configService.get('database'),
          ...baseConfig,
        };
      },
    }),

    TypeOrmModule.forFeature([User, Workspace, FeatureFlag, UsageMetric]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
