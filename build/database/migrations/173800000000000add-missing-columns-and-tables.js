"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMissingColumnsAndTables1738000000000 = void 0;
class AddMissingColumnsAndTables1738000000000 {
    name = 'AddMissingColumnsAndTables1738000000000';
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "workspaces"
      ADD COLUMN "owner_id" uuid NOT NULL DEFAULT uuid_generate_v4()
    `);
        await queryRunner.query(`
      UPDATE "workspaces"
      SET "owner_id" = "created_by"
      WHERE "owner_id" IS NULL OR "owner_id" = uuid_generate_v4()
    `);
        await queryRunner.query(`
      ALTER TABLE "workspaces"
      ALTER COLUMN "owner_id" DROP DEFAULT
    `);
        await queryRunner.query(`
      ALTER TABLE "workspaces"
      ADD CONSTRAINT "FK_workspaces_owner_id"
      FOREIGN KEY ("owner_id") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
        await queryRunner.query(`
      ALTER TABLE "workspaces"
      ADD COLUMN "deleted_at" TIMESTAMP
    `);
        await queryRunner.query(`
      ALTER TABLE "members"
      ADD COLUMN "permissions" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);
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
    }
    async down(queryRunner) {
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
        await queryRunner.query(`
      ALTER TABLE "members"
      DROP COLUMN IF EXISTS "permissions"
    `);
        await queryRunner.query(`
      ALTER TABLE "workspaces"
      DROP COLUMN IF EXISTS "deleted_at"
    `);
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
exports.AddMissingColumnsAndTables1738000000000 = AddMissingColumnsAndTables1738000000000;
//# sourceMappingURL=173800000000000add-missing-columns-and-tables.js.map