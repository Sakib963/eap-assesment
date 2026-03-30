import knex from 'knex';
import { env } from './env.js';

// Configuration for both development and production
const dbConfig = env.nodeEnv === 'production'
  ? {
      client: 'pg',
      connection: {
        connectionString: env.databaseUrl,
        ssl: { rejectUnauthorized: false },
      },
      pool: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000,
      },
    }
  : {
      client: 'pg',
      connection: {
        host: 'localhost',
        port: 5432,
        user: 'dbuser',
        password: 'dbpass',
        database: 'inventory',
        ssl: false,
      },
    };

// Initialize Knex with appropriate config
const db = knex(dbConfig);

/**
 * Health check: Verify database connectivity
 */
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; message: string }> {
  try {
    const result = await db.raw('SELECT NOW()');
    return {
      healthy: true,
      message: 'Database connection OK',
    };
  } catch (error) {
    return {
      healthy: false,
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Graceful shutdown
 */
export async function closeDatabase(): Promise<void> {
  await db.destroy();
  console.log('Database connection pool closed');
}

export default db;
