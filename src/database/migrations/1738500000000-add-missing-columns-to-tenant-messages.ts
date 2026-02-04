
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingColumnsToTenantMessages1738500000000 implements MigrationInterface {
    name = 'AddMissingColumnsToTenantMessages1738500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

            // Add type column if it doesn't exist
            await queryRunner.query(`
        ALTER TABLE "${schema_name}".messages 
        ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'text'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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