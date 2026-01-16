import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingColumnsAndTables1738000000000 implements MigrationInterface {
  name = 'AddMissingColumnsAndTables1738000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add owner_id to workspaces table
    await queryRunner.query(`
      ALTER TABLE "workspaces"
      ADD COLUMN IF NOT EXISTS "owner_id" uuid
    `);

    // Set owner_id to created_by for existing records
    await queryRunner.query(`
      UPDATE "workspaces"
      SET "owner_id" = "created_by"
      WHERE "owner_id" IS NULL
    `);

    // Make owner_id NOT NULL after setting values
    await queryRunner.query(`
      ALTER TABLE "workspaces"
      ALTER COLUMN "owner_id" SET NOT NULL
    `);

    // Add foreign key constraint for owner_id
    await queryRunner.query(`
      ALTER TABLE "workspaces"
      ADD CONSTRAINT "FK_workspaces_owner_id"
      FOREIGN KEY ("owner_id") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Add deleted_at (soft delete) to workspaces table
    await queryRunner.query(`
      ALTER TABLE "workspaces"
      ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP
    `);

    // Add permissions column to members table
    await queryRunner.query(`
      ALTER TABLE "members"
      ADD COLUMN IF NOT EXISTS "permissions" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);

    // Create workspace_invitations table if it doesn't exist
    const workspaceInvitationsTable = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'workspace_invitations'
      )
    `);

    if (!workspaceInvitationsTable[0].exists) {
      await queryRunner.query(`
        CREATE TABLE "workspace_invitations" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "workspace_id" uuid NOT NULL,
          "channel_id" uuid NOT NULL,
          "email" text NOT NULL,
          "role" character varying(50) NOT NULL DEFAULT 'member',
          "token" text NOT NULL,
          "invited_by" uuid,
          "sent_to" uuid,
          "invited_at" TIMESTAMP NOT NULL DEFAULT now(),
          "expires_at" TIMESTAMP NOT NULL,
          "accepted_at" TIMESTAMP,
          "accepted_by" uuid,
          "revoked_at" TIMESTAMP,
          "revoked_by" uuid,
          "status" character varying(20) NOT NULL DEFAULT 'pending',
          "message" text,
          CONSTRAINT "UQ_workspace_invitations_token" UNIQUE ("token"),
          CONSTRAINT "UQ_workspace_invitations_workspace_email_status" UNIQUE ("workspace_id", "email", "status"),
          CONSTRAINT "PK_workspace_invitations" PRIMARY KEY ("id")
        )
      `);

      // Create indexes for workspace_invitations
      await queryRunner.query(`
        CREATE INDEX "IDX_workspace_invitations_token" ON "workspace_invitations" ("token")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_workspace_invitations_workspace_email" ON "workspace_invitations" ("workspace_id", "email")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_workspace_invitations_expires_at" ON "workspace_invitations" ("expires_at")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_workspace_invitations_status" ON "workspace_invitations" ("status")
      `);

      // Add foreign key constraints for workspace_invitations
      await queryRunner.query(`
        ALTER TABLE "workspace_invitations"
        ADD CONSTRAINT "FK_workspace_invitations_workspace_id"
        FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
      `);

      await queryRunner.query(`
        ALTER TABLE "workspace_invitations"
        ADD CONSTRAINT "FK_workspace_invitations_invited_by"
        FOREIGN KEY ("invited_by") REFERENCES "users"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION
      `);

      await queryRunner.query(`
        ALTER TABLE "workspace_invitations"
        ADD CONSTRAINT "FK_workspace_invitations_sent_to"
        FOREIGN KEY ("sent_to") REFERENCES "users"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION
      `);

      await queryRunner.query(`
        ALTER TABLE "workspace_invitations"
        ADD CONSTRAINT "FK_workspace_invitations_accepted_by"
        FOREIGN KEY ("accepted_by") REFERENCES "users"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION
      `);

      await queryRunner.query(`
        ALTER TABLE "workspace_invitations"
        ADD CONSTRAINT "FK_workspace_invitations_revoked_by"
        FOREIGN KEY ("revoked_by") REFERENCES "users"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION
      `);
    } else {
      // If table exists, just add the sent_to column if it's missing
      await queryRunner.query(`
        ALTER TABLE "workspace_invitations"
        ADD COLUMN IF NOT EXISTS "sent_to" uuid
      `);

      await queryRunner.query(`
        ALTER TABLE "workspace_invitations"
        ADD CONSTRAINT "FK_workspace_invitations_sent_to"
        FOREIGN KEY ("sent_to") REFERENCES "users"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop workspace_invitations constraints
    await queryRunner.query(`
      ALTER TABLE "workspace_invitations"
      DROP CONSTRAINT IF EXISTS "FK_workspace_invitations_revoked_by"
    `);

    await queryRunner.query(`
      ALTER TABLE "workspace_invitations"
      DROP CONSTRAINT IF EXISTS "FK_workspace_invitations_accepted_by"
    `);

    await queryRunner.query(`
      ALTER TABLE "workspace_invitations"
      DROP CONSTRAINT IF EXISTS "FK_workspace_invitations_sent_to"
    `);

    await queryRunner.query(`
      ALTER TABLE "workspace_invitations"
      DROP CONSTRAINT IF EXISTS "FK_workspace_invitations_invited_by"
    `);

    await queryRunner.query(`
      ALTER TABLE "workspace_invitations"
      DROP CONSTRAINT IF EXISTS "FK_workspace_invitations_workspace_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_workspace_invitations_status"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_workspace_invitations_expires_at"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_workspace_invitations_workspace_email"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_workspace_invitations_token"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "workspace_invitations"
    `);

    // Remove permissions from members table
    await queryRunner.query(`
      ALTER TABLE "members"
      DROP COLUMN IF EXISTS "permissions"
    `);

    // Remove deleted_at from workspaces table
    await queryRunner.query(`
      ALTER TABLE "workspaces"
      DROP COLUMN IF EXISTS "deleted_at"
    `);

    // Remove owner_id from workspaces table
    await queryRunner.query(`
      ALTER TABLE "workspaces"
      DROP CONSTRAINT IF EXISTS "FK_workspaces_owner_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "workspaces"
      DROP COLUMN IF EXISTS "owner_id"
    `);
  }
}
