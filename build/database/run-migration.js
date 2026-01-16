"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const database_config_1 = require("../config/database.config");
async function run() {
    const dataSource = new typeorm_1.DataSource({
        ...(0, database_config_1.databaseConfig)(),
        synchronize: false,
        migrationsRun: false,
    });
    try {
        console.log('🔌 Connecting to database...');
        await dataSource.initialize();
        console.log('🚀 Running migrations...');
        const result = await dataSource.runMigrations();
        console.log(`✅ ${result.length} migrations executed`);
        await dataSource.destroy();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}
run();
//# sourceMappingURL=run-migration.js.map