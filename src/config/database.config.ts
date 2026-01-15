import { registerAs } from '@nestjs/config';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export const databaseConfig = registerAs('database', () => ({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,

  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],

  synchronize: false,
  logging: true,
}));

