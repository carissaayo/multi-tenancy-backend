import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveChannelIdFromWorkspaceInvitations1738600000000 implements MigrationInterface {
  name = 'RemoveChannelIdFromWorkspaceInvitations1738600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "workspace_invitations" 
      DROP COLUMN IF EXISTS "channel_id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "workspace_invitations" 
      ADD COLUMN IF NOT EXISTS "channel_id" uuid
    `);
  }
}
