import { DataSource } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: join(__dirname, '../../../.env') });

import { User } from '../../modules/users/entities/user.entity';
import { Workspace } from '../../modules/workspaces/entities/workspace.entity';
import { FeatureFlag } from '../feature-flags/entities/feature-flag.entity';
import { UsageMetric } from '../usage/entities/usage.entity';
import { RefreshToken } from '../security/entities/refresh-token.entity';
import { WorkspaceMemberEntity } from '../../modules/members/entities/member.entity';
import { ChannelEntity } from '../../modules/channels/entities/channel.entity';
import { ChannelMemberEntity } from '../../modules/channels/entities/channel-member.entity';
import { MessageEntity } from '../../modules/messages/entities/message.entity';
import { FileEntity } from '../../modules/files/entities/file.entity';
import { ReactionEntity } from '../../modules/reactions/entities/reaction.entity';
import { WorkspaceInvitation } from 'src/modules/workspaces/entities/workspace_initations.entity';
import { ChannelInvitation } from 'src/modules/channels/entities/channel_invitations.entity';

const databaseUrl = process.env.DATABASE_URL;


const baseConfig = {
  entities: [
    // Public schema entities
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
    ChannelInvitation,
  ],
  migrations: [join(__dirname, '../../database/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
};

// Use DATABASE_URL if available (e.g., Render), otherwise use individual params
export const AppDataSource = new DataSource(
  databaseUrl
    ? {
        type: 'postgres',
        url: databaseUrl,
        ssl: { rejectUnauthorized: false },
        ...baseConfig,
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST || 'postgres',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'multi_tenancy',
        ...baseConfig,
      },
);
