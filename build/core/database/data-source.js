"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const path_1 = require("path");
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: (0, path_1.join)(__dirname, '../../../.env') });
const user_entity_1 = require("../../modules/users/entities/user.entity");
const workspace_entity_1 = require("../../modules/workspaces/entities/workspace.entity");
const feature_flag_entity_1 = require("../feature-flags/entities/feature-flag.entity");
const usage_entity_1 = require("../usage/entities/usage.entity");
const refresh_token_entity_1 = require("../security/entities/refresh-token.entity");
const member_entity_1 = require("../../modules/members/entities/member.entity");
const channel_entity_1 = require("../../modules/channels/entities/channel.entity");
const channel_member_entity_1 = require("../../modules/channels/entities/channel-member.entity");
const message_entity_1 = require("../../modules/messages/entities/message.entity");
const file_entity_1 = require("../../modules/files/entities/file.entity");
const reaction_entity_1 = require("../../modules/reactions/entities/reaction.entity");
const workspace_initations_entity_1 = require("../../modules/workspaces/entities/workspace_initations.entity");
const channel_invitations_entity_1 = require("../../modules/channels/entities/channel_invitations.entity");
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
    migrations: [(0, path_1.join)(__dirname, '../../database/migrations/*{.ts,.js}')],
    synchronize: false,
    logging: true,
};
exports.AppDataSource = new typeorm_1.DataSource(databaseUrl
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
    });
//# sourceMappingURL=data-source.js.map