"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantConnectionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const core_1 = require("@nestjs/core");
let TenantConnectionService = class TenantConnectionService {
    dataSource;
    request;
    currentSchema;
    constructor(dataSource, request) {
        this.dataSource = dataSource;
        this.request = request;
    }
    setSchema(workspaceSlug) {
        this.currentSchema = `workspace_${workspaceSlug}`;
    }
    getSchema() {
        if (!this.currentSchema) {
            throw new Error('Tenant schema not set. Did you forget tenant middleware?');
        }
        return this.currentSchema;
    }
    async query(sql, parameters) {
        await this.switchToTenantSchema();
        return this.dataSource.query(sql, parameters);
    }
    async switchToTenantSchema() {
        const schema = this.getSchema();
        await this.dataSource.query(`SET search_path TO ${schema}, public`);
    }
    async createWorkspaceSchema(workspaceSlug) {
        const schemaName = `workspace_${workspaceSlug}`;
        await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
        await this.createTenantTables(schemaName);
    }
    async createTenantTables(schemaName) {
        const queries = [
            `CREATE TABLE IF NOT EXISTS ${schemaName}.members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        role VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        joined_at TIMESTAMP DEFAULT NOW()
      )`,
            `CREATE TABLE IF NOT EXISTS ${schemaName}.channels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_private BOOLEAN DEFAULT false,
        created_by UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
            `CREATE TABLE IF NOT EXISTS ${schemaName}.channel_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel_id UUID NOT NULL REFERENCES ${schemaName}.channels(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES ${schemaName}.members(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(channel_id, member_id)
      )`,
            `CREATE TABLE IF NOT EXISTS ${schemaName}.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES ${schemaName}.channels(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES ${schemaName}.members(id),
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text',
  thread_id UUID REFERENCES ${schemaName}.messages(id),
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
)`,
            `CREATE TABLE IF NOT EXISTS ${schemaName}.files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel_id UUID NOT NULL REFERENCES ${schemaName}.channels(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES ${schemaName}.members(id),
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100),
        storage_key VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
            `CREATE TABLE IF NOT EXISTS ${schemaName}.reactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID NOT NULL REFERENCES ${schemaName}.messages(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES ${schemaName}.members(id),
        emoji VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(message_id, member_id, emoji)
      )`,
            `CREATE INDEX IF NOT EXISTS idx_members_user_id ON ${schemaName}.members(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_messages_channel ON ${schemaName}.messages(channel_id)`,
            `CREATE INDEX IF NOT EXISTS idx_messages_thread ON ${schemaName}.messages(thread_id)`,
            `CREATE INDEX IF NOT EXISTS idx_channel_members_channel ON ${schemaName}.channel_members(channel_id)`,
            `CREATE INDEX IF NOT EXISTS idx_channel_members_member ON ${schemaName}.channel_members(member_id)`,
        ];
        for (const query of queries) {
            await this.dataSource.query(query);
        }
    }
    async dropWorkspaceSchema(workspaceSlug) {
        const schemaName = `workspace_${workspaceSlug}`;
        await this.dataSource.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    }
};
exports.TenantConnectionService = TenantConnectionService;
exports.TenantConnectionService = TenantConnectionService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST }),
    __param(1, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [typeorm_1.DataSource, Object])
], TenantConnectionService);
//# sourceMappingURL=tenant-connection.service.js.map