"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMissingColumnsToTenantMessages1738500000000 = void 0;
class AddMissingColumnsToTenantMessages1738500000000 {
    name = 'AddMissingColumnsToTenantMessages1738500000000';
    async up(queryRunner) {
        const schemas = await queryRunner.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'workspace_%'
    `);
        for (const { schema_name } of schemas) {
            await queryRunner.query(`
        ALTER TABLE "${schema_name}".messages 
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
      `);
            await queryRunner.query(`
        ALTER TABLE "${schema_name}".messages 
        ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'text'
      `);
            console.log(`Updated messages table in schema: ${schema_name}`);
        }
    }
    async down(queryRunner) {
        const schemas = await queryRunner.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'workspace_%'
    `);
        for (const { schema_name } of schemas) {
            await queryRunner.query(`
        ALTER TABLE "${schema_name}".messages 
        DROP COLUMN IF EXISTS deleted_at
      `);
            await queryRunner.query(`
        ALTER TABLE "${schema_name}".messages 
        DROP COLUMN IF EXISTS type
      `);
        }
    }
}
exports.AddMissingColumnsToTenantMessages1738500000000 = AddMissingColumnsToTenantMessages1738500000000;
//# sourceMappingURL=1738500000000-add-missing-columns-to-tenant-messages.js.map