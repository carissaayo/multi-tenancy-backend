import { registerAs } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { join } from 'path';
import config from './config';
const appConfig = config();
export default registerAs(
  'database',
  (): DataSourceOptions => ({
    type: 'postgres',
    host: appConfig.database.host,
    port: appConfig.database.port,
    username: appConfig.database.username,
    password: appConfig.database.password,
    database: appConfig.database.database,

    // Public schema entities (use class-based decorators)
    entities: [join(__dirname, '../**/*.entity{.ts,.js}')],

    // Tenant schema entities (use EntitySchema)
    // These are registered manually in the module

    synchronize: process.env.DATABASE_SYNC === 'true',
    logging: process.env.DATABASE_LOGGING === 'true',

    // Migration settings
    migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
    migrationsRun: false,

    // Connection pool
    poolSize: 10,

    // Schema settings
    schema: 'public', // Default schema
  }),
);
