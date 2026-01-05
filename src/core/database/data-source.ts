import { DataSource } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';

//  Load env FIRST (TypeORM CLI does NOT do this for you)
dotenv.config({ path: join(__dirname, '../../../.env') });

import config from '../../config/config';


const appConfig = config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: appConfig.database.host,
  port: appConfig.database.port,
  username: appConfig.database.username,
  password: appConfig.database.password,
  database: appConfig.database.database,

  entities: [join(__dirname, '../../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../../database/migrations/*{.ts,.js}')],

  synchronize: false,
  logging: true,
});
