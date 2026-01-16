import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneNumberToUsers1737000000000 implements MigrationInterface {
  name = 'AddPhoneNumberToUsers1737000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "phone_number" character varying(20)
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
      DROP COLUMN "phone_number"
    `);
  }
}
