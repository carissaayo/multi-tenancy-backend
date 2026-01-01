import { Injectable, Inject, Scope } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class TenantConnectionService {
  private currentSchema: string;

  constructor(
    private readonly dataSource: DataSource,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  /**
   * Set the current tenant schema
   */
  setSchema(workspaceSlug: string): void {
    this.currentSchema = `workspace_${workspaceSlug}`;
  }

  /**
   * Get the current tenant schema
   */
  getSchema(): string {
    if (!this.currentSchema) {
      throw new Error(
        'Tenant schema not set. Did you forget tenant middleware?',
      );
    }
    return this.currentSchema;
  }

  /**
   * Execute query in tenant schema
   */
  async query<T = any>(sql: string, parameters?: any[]): Promise<T> {
    await this.switchToTenantSchema();
    return this.dataSource.query(sql, parameters);
  }

  /**
   * Switch PostgreSQL search_path to tenant schema
   */
  async switchToTenantSchema(): Promise<void> {
    const schema = this.getSchema();
    await this.dataSource.query(`SET search_path TO ${schema}, public`);
  }

  /**
   * Create a new workspace schema
   */
  async createWorkspaceSchema(workspaceSlug: string): Promise<void> {
    const schemaName = `workspace_${workspaceSlug}`;

    // Create schema
    await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

    // Create tables in the new schema
    await this.createTenantTables(schemaName);
  }

  /**
   * Create all tenant tables in a schema
   */
  private async createTenantTables(schemaName: string): Promise<void> {
    const queries = [
      // Members table
      `CREATE TABLE IF NOT EXISTS ${schemaName}.members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        role VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        joined_at TIMESTAMP DEFAULT NOW()
      )`,

      // Channels table
      `CREATE TABLE IF NOT EXISTS ${schemaName}.channels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_private BOOLEAN DEFAULT false,
        created_by UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Channel members table
      `CREATE TABLE IF NOT EXISTS ${schemaName}.channel_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel_id UUID NOT NULL REFERENCES ${schemaName}.channels(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES ${schemaName}.members(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(channel_id, member_id)
      )`,

      // Messages table
      `CREATE TABLE IF NOT EXISTS ${schemaName}.messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel_id UUID NOT NULL REFERENCES ${schemaName}.channels(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES ${schemaName}.members(id),
        content TEXT NOT NULL,
        thread_id UUID REFERENCES ${schemaName}.messages(id),
        is_edited BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Files table
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

      // Reactions table
      `CREATE TABLE IF NOT EXISTS ${schemaName}.reactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID NOT NULL REFERENCES ${schemaName}.messages(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES ${schemaName}.members(id),
        emoji VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(message_id, member_id, emoji)
      )`,

      // Create indexes
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

  /**
   * Drop a workspace schema (careful!)
   */
  async dropWorkspaceSchema(workspaceSlug: string): Promise<void> {
    const schemaName = `workspace_${workspaceSlug}`;
    await this.dataSource.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
  }
}
