import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileFieldsToUsers1737000000001 implements MigrationInterface {
  name = 'AddProfileFieldsToUsers1737000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "phone_number" character varying(20),
      ADD COLUMN "bio" character varying(500),
      ADD COLUMN "city" character varying(500),
      ADD COLUMN "state" character varying(500),
      ADD COLUMN "country" character varying(500)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_users_phone_number"
      ON "users" ("phone_number")
      WHERE "phone_number" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_users_phone_number"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "country",
      DROP COLUMN "state",
      DROP COLUMN "city",
      DROP COLUMN "bio",
      DROP COLUMN "phone_number"
    `);
  }
}
