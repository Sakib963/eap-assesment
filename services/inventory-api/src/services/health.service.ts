import { checkDatabaseHealth } from '../config/database.js';

export interface HealthSnapshot {
  status: 'healthy' | 'unhealthy';
  service: 'backend';
  environment: string;
  database: {
    status: 'connected' | 'disconnected';
    message: string;
  };
  timestamp: string;
}

export const getHealthSnapshot = async (): Promise<{ statusCode: number; payload: HealthSnapshot }> => {
  const dbHealth = await checkDatabaseHealth();

  return {
    statusCode: dbHealth.healthy ? 200 : 503,
    payload: {
      status: dbHealth.healthy ? 'healthy' : 'unhealthy',
      service: 'backend',
      environment: process.env.NODE_ENV ?? 'development',
      database: {
        status: dbHealth.healthy ? 'connected' : 'disconnected',
        message: dbHealth.message,
      },
      timestamp: new Date().toISOString(),
    },
  };
};
