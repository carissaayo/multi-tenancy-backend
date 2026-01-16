"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("../../modules/users/entities/user.entity");
const workspace_entity_1 = require("../../modules/workspaces/entities/workspace.entity");
const feature_flag_entity_1 = require("../feature-flags/entities/feature-flag.entity");
const usage_entity_1 = require("../usage/entities/usage.entity");
const refresh_token_entity_1 = require("../security/entities/refresh-token.entity");
const workspace_initations_entity_1 = require("../../modules/workspaces/entities/workspace_initations.entity");
const member_entity_1 = require("../../modules/members/entities/member.entity");
const channel_entity_1 = require("../../modules/channels/entities/channel.entity");
const channel_member_entity_1 = require("../../modules/channels/entities/channel-member.entity");
const message_entity_1 = require("../../modules/messages/entities/message.entity");
const file_entity_1 = require("../../modules/files/entities/file.entity");
const reaction_entity_1 = require("../../modules/reactions/entities/reaction.entity");
const database_config_1 = require("../../config/database.config");
const channel_invitations_entity_1 = require("../../modules/channels/entities/channel_invitations.entity");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            config_1.ConfigModule.forFeature(database_config_1.databaseConfig),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const isProd = process.env.NODE_ENV === 'production';
                    const databaseUrl = process.env.DATABASE_URL;
                    const baseConfig = {
                        entities: [
                            user_entity_1.User,
                            workspace_entity_1.Workspace,
                            workspace_initations_entity_1.WorkspaceInvitation,
                            feature_flag_entity_1.FeatureFlag,
                            usage_entity_1.UsageMetric,
                            refresh_token_entity_1.RefreshToken,
                            member_entity_1.WorkspaceMemberEntity,
                            channel_entity_1.ChannelEntity,
                            channel_member_entity_1.ChannelMemberEntity,
                            message_entity_1.MessageEntity,
                            file_entity_1.FileEntity,
                            reaction_entity_1.ReactionEntity,
                            channel_invitations_entity_1.ChannelInvitation,
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
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, workspace_entity_1.Workspace, feature_flag_entity_1.FeatureFlag, usage_entity_1.UsageMetric]),
        ],
        providers: [],
        exports: [typeorm_1.TypeOrmModule],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map