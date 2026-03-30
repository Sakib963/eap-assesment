import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { checkDatabaseHealth } from './config/database.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', async (_req, res) => {
  const dbHealth = await checkDatabaseHealth();
  
  res.status(dbHealth.healthy ? 200 : 503).json({
    status: dbHealth.healthy ? 'healthy' : 'unhealthy',
    service: 'backend',
    environment: env.nodeEnv,
    database: {
      status: dbHealth.healthy ? 'connected' : 'disconnected',
      message: dbHealth.message,
    },
    timestamp: new Date().toISOString(),
  });
});
