"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerFirstMigration1767701843036 = void 0;
class DockerFirstMigration1767701843036 {
    name = 'DockerFirstMigration1767701843036';
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "full_name" character varying(255), "avatar_url" character varying(500), "email_code" character varying(255), "is_email_verified" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "last_login_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "lock_until" TIMESTAMP, "failed_login_attempts" integer NOT NULL DEFAULT '0', "password_reset_code" character varying(255), "reset_password_expires" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "workspaces" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying(100) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "logo_url" character varying(500), "plan" character varying(50) NOT NULL DEFAULT 'free', "is_active" boolean NOT NULL DEFAULT true, "settings" jsonb NOT NULL DEFAULT '{}', "created_by" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b8e9fe62e93d60089dfc4f175f3" UNIQUE ("slug"), CONSTRAINT "PK_098656ae401f3e1a4586f47fd8e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "feature_flags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspace_id" uuid NOT NULL, "feature_key" character varying(100) NOT NULL, "is_enabled" boolean NOT NULL DEFAULT false, "metadata" jsonb, CONSTRAINT "UQ_e0304da6042c37a4782998a49ec" UNIQUE ("workspace_id", "feature_key"), CONSTRAINT "PK_db657d344e9caacfc9d5cf8bbac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "usage_metrics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspace_id" uuid NOT NULL, "metric_type" character varying(50) NOT NULL, "value" bigint NOT NULL DEFAULT '0', "period" character varying(20), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_14c6ae2b6c1b7114c80fc3c1aec" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token_hash" character varying(500) NOT NULL, "user_id" uuid NOT NULL, "expires_at" TIMESTAMP NOT NULL, "last_used_at" TIMESTAMP, "is_revoked" boolean NOT NULL DEFAULT false, "revoked_at" TIMESTAMP, "revoked_reason" character varying(255), "user_agent" character varying(500) NOT NULL DEFAULT '', "ip_address" character varying(100) NOT NULL DEFAULT '', "version" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ba3bd69c8ad1e799c0256e9e50" ON "refresh_tokens" ("expires_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_3a5f57e17354e7407757e8793b" ON "refresh_tokens" ("is_revoked") `);
        await queryRunner.query(`CREATE INDEX "IDX_3ddc983c5f7bcf132fd8732c3f" ON "refresh_tokens" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a7838d2ba25be1342091b6695f" ON "refresh_tokens" ("token_hash") `);
        await queryRunner.query(`CREATE TABLE "members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "role" character varying(50) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "joined_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_28b53062261b996d9c99fa12404" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_members_user_id" ON "members" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "channels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "is_private" boolean NOT NULL DEFAULT false, "created_by" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_bc603823f3f741359c2339389f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_channels_name" ON "channels" ("name") `);
        await queryRunner.query(`CREATE TABLE "channel_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "channel_id" uuid NOT NULL, "member_id" uuid NOT NULL, "joined_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "unique_channel_member" UNIQUE ("channel_id", "member_id"), CONSTRAINT "PK_95976b619edca48aed364c70c36" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_channel_members_channel" ON "channel_members" ("channel_id") `);
        await queryRunner.query(`CREATE INDEX "idx_channel_members_member" ON "channel_members" ("member_id") `);
        await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "channel_id" uuid NOT NULL, "member_id" uuid NOT NULL, "content" text NOT NULL, "thread_id" uuid, "is_edited" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_messages_channel" ON "messages" ("channel_id") `);
        await queryRunner.query(`CREATE INDEX "idx_messages_thread" ON "messages" ("thread_id") `);
        await queryRunner.query(`CREATE INDEX "idx_messages_created_at" ON "messages" ("created_at") `);
        await queryRunner.query(`CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "channel_id" uuid NOT NULL, "member_id" uuid NOT NULL, "file_name" character varying(255) NOT NULL, "file_size" bigint NOT NULL, "mime_type" character varying(100), "storage_key" character varying(500) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_files_channel" ON "files" ("channel_id") `);
        await queryRunner.query(`CREATE TABLE "reactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "message_id" uuid NOT NULL, "member_id" uuid NOT NULL, "emoji" character varying(50) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "unique_message_member_emoji" UNIQUE ("message_id", "member_id", "emoji"), CONSTRAINT "PK_0b213d460d0c473bc2fb6ee27f3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_reactions_message" ON "reactions" ("message_id") `);
        await queryRunner.query(`ALTER TABLE "workspaces" ADD CONSTRAINT "FK_62422395ad425ffda42e4104056" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feature_flags" ADD CONSTRAINT "FK_9f6fd89ddf4d49c3a5e63b49847" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usage_metrics" ADD CONSTRAINT "FK_3132f164d6577885e98e0d2896b" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
        await queryRunner.query(`ALTER TABLE "usage_metrics" DROP CONSTRAINT "FK_3132f164d6577885e98e0d2896b"`);
        await queryRunner.query(`ALTER TABLE "feature_flags" DROP CONSTRAINT "FK_9f6fd89ddf4d49c3a5e63b49847"`);
        await queryRunner.query(`ALTER TABLE "workspaces" DROP CONSTRAINT "FK_62422395ad425ffda42e4104056"`);
        await queryRunner.query(`DROP INDEX "public"."idx_reactions_message"`);
        await queryRunner.query(`DROP TABLE "reactions"`);
        await queryRunner.query(`DROP INDEX "public"."idx_files_channel"`);
        await queryRunner.query(`DROP TABLE "files"`);
        await queryRunner.query(`DROP INDEX "public"."idx_messages_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_messages_thread"`);
        await queryRunner.query(`DROP INDEX "public"."idx_messages_channel"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP INDEX "public"."idx_channel_members_member"`);
        await queryRunner.query(`DROP INDEX "public"."idx_channel_members_channel"`);
        await queryRunner.query(`DROP TABLE "channel_members"`);
        await queryRunner.query(`DROP INDEX "public"."idx_channels_name"`);
        await queryRunner.query(`DROP TABLE "channels"`);
        await queryRunner.query(`DROP INDEX "public"."idx_members_user_id"`);
        await queryRunner.query(`DROP TABLE "members"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a7838d2ba25be1342091b6695f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3ddc983c5f7bcf132fd8732c3f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3a5f57e17354e7407757e8793b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ba3bd69c8ad1e799c0256e9e50"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "usage_metrics"`);
        await queryRunner.query(`DROP TABLE "feature_flags"`);
        await queryRunner.query(`DROP TABLE "workspaces"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
exports.DockerFirstMigration1767701843036 = DockerFirstMigration1767701843036;
//# sourceMappingURL=1767701843036-DockerFirstMigration.js.map