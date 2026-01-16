"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddProfileFieldsToUsers1737000000001 = void 0;
class AddProfileFieldsToUsers1737000000001 {
    name = 'AddProfileFieldsToUsers1737000000001';
    async up(queryRunner) {
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
    async down(queryRunner) {
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
exports.AddProfileFieldsToUsers1737000000001 = AddProfileFieldsToUsers1737000000001;
//# sourceMappingURL=1737000000000-add-phone-number-to-users.js.map