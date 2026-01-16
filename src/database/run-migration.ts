import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { databaseConfig } from '../config/database.config';

async function run() {
  const dataSource = new DataSource({
    ...databaseConfig(),
    synchronize: false,
    migrationsRun: false,
  } as any);

  try {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();

    console.log('🚀 Running migrations...');
    const result = await dataSource.runMigrations();

    console.log(`✅ ${result.length} migrations executed`);
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

run();
