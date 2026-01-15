"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateChannelInvitations1736970000000 = void 0;
class CreateChannelInvitations1736970000000 {
    name = 'CreateChannelInvitations1736970000000';
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "channel_invitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "channel_id" uuid NOT NULL, "workspace_id" uuid NOT NULL, "member_id" uuid NOT NULL, "token" text NOT NULL, "invited_by" uuid, "invited_at" TIMESTAMP NOT NULL DEFAULT now(), "expires_at" TIMESTAMP NOT NULL, "accepted_at" TIMESTAMP, "accepted_by" uuid, "revoked_at" TIMESTAMP, "revoked_by" uuid, "status" character varying(20) NOT NULL DEFAULT 'pending', "message" text, CONSTRAINT "UQ_channel_invitations_token" UNIQUE ("token"), CONSTRAINT "UQ_channel_invitations_channel_member_status" UNIQUE ("channel_id", "member_id", "status"), CONSTRAINT "PK_channel_invitations" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_channel_invitations_token" ON "channel_invitations" ("token") `);
        await queryRunner.query(`CREATE INDEX "IDX_channel_invitations_channel_member" ON "channel_invitations" ("channel_id", "member_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_channel_invitations_expires_at" ON "channel_invitations" ("expires_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_channel_invitations_status" ON "channel_invitations" ("status") `);
        await queryRunner.query(`ALTER TABLE "channel_invitations" ADD CONSTRAINT "FK_channel_invitations_invited_by" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_invitations" ADD CONSTRAINT "FK_channel_invitations_accepted_by" FOREIGN KEY ("accepted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_invitations" ADD CONSTRAINT "FK_channel_invitations_revoked_by" FOREIGN KEY ("revoked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel_invitations" DROP CONSTRAINT "FK_channel_invitations_revoked_by"`);
        await queryRunner.query(`ALTER TABLE "channel_invitations" DROP CONSTRAINT "FK_channel_invitations_accepted_by"`);
        await queryRunner.query(`ALTER TABLE "channel_invitations" DROP CONSTRAINT "FK_channel_invitations_invited_by"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_channel_invitations_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_channel_invitations_expires_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_channel_invitations_channel_member"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_channel_invitations_token"`);
        await queryRunner.query(`DROP TABLE "channel_invitations"`);
    }
}
exports.CreateChannelInvitations1736970000000 = CreateChannelInvitations1736970000000;
//# sourceMappingURL=1736366747748-secondmigration.js.map