"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUserNameToUsers1739000000000 = void 0;
class AddUserNameToUsers1739000000000 {
    name = 'AddUserNameToUsers1739000000000';
    async up(queryRunner) {
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
    async down(queryRunner) {
        await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_users_user_name"
    `);
        await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "user_name"
    `);
    }
}
exports.AddUserNameToUsers1739000000000 = AddUserNameToUsers1739000000000;
//# sourceMappingURL=1739000000000-add-user-name-to-users.js.map