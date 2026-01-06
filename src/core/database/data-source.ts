// src/core/database/data-source.ts
import { DataSource } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load env FIRST (TypeORM CLI does NOT do this for you)
dotenv.config({ path: join(__dirname, '../../../.env') });

import config from '../../config/config';

const appConfig = config();

// Import all entities explicitly
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

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: appConfig.database.host,
  port: appConfig.database.port,
  username: appConfig.database.username,
  password: appConfig.database.password,
  database: appConfig.database.database,

  // Explicitly list all entities (works better in Docker)
  entities: [
    // Public schema entities
    User,
    Workspace,
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

  migrations: [join(__dirname, '../../database/migrations/*{.ts,.js}')],

  synchronize: false,
  logging: true,
});
