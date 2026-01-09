import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from '../../config/database.config';

// Public schema entities
import { User } from '../../modules/users/entities/user.entity';
import { Workspace } from '../../modules/workspaces/entities/workspace.entity';
import { FeatureFlag } from '../feature-flags/entities/feature-flag.entity';

// Tenant schema entities (EntitySchema)

import { ChannelEntity } from '../../modules/channels/entities/channel.entity';
import { ChannelMemberEntity } from '../../modules/channels/entities/channel-member.entity';
import { MessageEntity } from '../../modules/messages/entities/message.entity';
import { FileEntity } from '../../modules/files/entities/file.entity';
import { UsageMetric } from '../usage/entities/usage.entity';
import { WorkspaceMemberEntity } from 'src/modules/members/entities/member.entity';
import { ReactionEntity } from 'src/modules/reactions/entities/reaction.entity';
import { RefreshToken } from '../security/entities/refresh-token.entity';
import { WorkspaceInvitation } from 'src/modules/workspaces/entities/workspace_initations.entity';


@Global()
@Module({
  imports: [
    // Load database configuration
    ConfigModule.forFeature(databaseConfig),

    // TypeORM main connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');

        return {
          ...dbConfig,

          // Register all entities
          entities: [
            // Public schema entities (decorator-based)
            User,
            Workspace,
            WorkspaceInvitation,
            FeatureFlag,
            UsageMetric,
            RefreshToken,
            // Tenant schema entities (EntitySchema)
            WorkspaceMemberEntity,
            ChannelEntity,
            ChannelMemberEntity,
            MessageEntity,
            FileEntity,
            ReactionEntity,
          ],

          // Extra options
          extra: {
            // Connection pool configuration
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          },
        };
      },
    }),

    // Register repositories for public schema entities
    TypeOrmModule.forFeature([User, Workspace, FeatureFlag, UsageMetric]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
