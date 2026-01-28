import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserNameToUsers1739000000000 implements MigrationInterface {
  name = 'AddUserNameToUsers1739000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "user_name" character varying(255)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_users_user_name"
      ON "users" ("user_name")
      WHERE "user_name" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_users_user_name"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "user_name"
    `);
  }
}
