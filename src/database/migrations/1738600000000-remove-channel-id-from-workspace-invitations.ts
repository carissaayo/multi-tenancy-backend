import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveChannelIdFromWorkspaceInvitations1738600000000 implements MigrationInterface {
  name = 'RemoveChannelIdFromWorkspaceInvitations1738600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the channel_id column from workspace_invitations
    // It was incorrectly added as NOT NULL but workspace invites don't need channel_id
    await queryRunner.query(`
      ALTER TABLE "workspace_invitations" 
      DROP COLUMN IF EXISTS "channel_id"
    `);

    console.log('Removed channel_id column from workspace_invitations table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add the column if needed (nullable this time)
    await queryRunner.query(`
      ALTER TABLE "workspace_invitations" 
      ADD COLUMN IF NOT EXISTS "channel_id" uuid
    `);

    console.log('Re-added channel_id column to workspace_invitations table');
  }
}
