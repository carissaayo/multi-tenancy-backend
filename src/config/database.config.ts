import { registerAs } from '@nestjs/config';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export const databaseConfig = registerAs('database', () => {
  const databaseUrl = process.env.DATABASE_URL;

  // If DATABASE_URL is provided (e.g., Render), use it
  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      ssl: { rejectUnauthorized: false },
      entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
      migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
      synchronize: false,
      logging: true,
    };
  }

  // Otherwise, use individual connection parameters (e.g., Docker)
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'postgres', // Use 'postgres' as default for Docker service name
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'multi_tenancy',
    ssl: false,
    entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
    synchronize: false,
    logging: true,
  };
});
