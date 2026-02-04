"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveChannelIdFromWorkspaceInvitations1738600000000 = void 0;
class RemoveChannelIdFromWorkspaceInvitations1738600000000 {
    name = 'RemoveChannelIdFromWorkspaceInvitations1738600000000';
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "workspace_invitations" 
      DROP COLUMN IF EXISTS "channel_id"
    `);
        console.log('Removed channel_id column from workspace_invitations table');
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "workspace_invitations" 
      ADD COLUMN IF NOT EXISTS "channel_id" uuid
    `);
        console.log('Re-added channel_id column to workspace_invitations table');
    }
}
exports.RemoveChannelIdFromWorkspaceInvitations1738600000000 = RemoveChannelIdFromWorkspaceInvitations1738600000000;
//# sourceMappingURL=1738600000000-remove-channel-id-from-workspace-invitations.js.map