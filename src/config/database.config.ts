import { registerAs } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { join } from 'path';

export default registerAs(
  'database',
  (): DataSourceOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    // Public schema entities (use class-based decorators)
    entities: [join(__dirname, '../**/*.entity{.ts,.js}')],

    // Tenant schema entities (use EntitySchema)
    // These are registered manually in the module
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',

    // Migration settings
    migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
    migrationsRun: false,

    // Connection pool
    poolSize: 10,

    // Schema settings
    schema: 'public', // Default schema
  }),
);
