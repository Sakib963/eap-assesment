import type { Knex } from 'knex';
import { env } from './src/config/env.js';

/**
 * Knex configuration - uses DATABASE_URL from .env
 * Connects directly to Render PostgreSQL
 */
const config: Record<string, Knex.Config> = {
  production: {
    client: 'pg',
    connection: {
      connectionString: env.databaseUrl,
      ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './dist/database/migrations',
      extension: 'js',
    },
    seeds: {
      directory: './dist/database/seeds',
      extension: 'js',
    },
  },
};

export default config;
