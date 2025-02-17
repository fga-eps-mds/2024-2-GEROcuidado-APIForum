import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

const ENV = !process.env.NODE_ENV ? '.env' : `.env.${process.env.NODE_ENV}`;
const path = resolve(__dirname, `../${ENV}`);

const envConfig = dotenv.parse(readFileSync(path));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'gerocuidado-forum-db', // Nome do serviço no Docker Compose
  port: process.env.DB_PORT ? +process.env.DB_PORT : 5002, // Porta interna do PostgreSQL
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE || 'gerocuidado-forum-db',
  migrationsTableName: 'migrations',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: false,
  migrationsRun: true,
  logging: false,
  migrations: [__dirname + '/migration/**/*{.ts,.js}'],
};

const appDataSource = new DataSource(config);

export default appDataSource;

export const typeOrmConfig: TypeOrmModuleOptions = config;