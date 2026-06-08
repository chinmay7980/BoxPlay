import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();
import { DataSource } from 'typeorm';
import * as entities from './entities';

// Resolve database URL from environment. If not provided, fallback to standard local details.
const dbUrl = process.env.DATABASE_URL;

export const AppDataSource = new DataSource(
  dbUrl
    ? {
        type: 'postgres',
        url: dbUrl,
        entities: Object.values(entities),
        migrations: [__dirname + '/migrations/*.ts'],
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'boxplay',
        entities: Object.values(entities),
        migrations: [__dirname + '/migrations/*.ts'],
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
      },
);
