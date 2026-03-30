import type { Request, Response } from 'express';
import { getHealthSnapshot } from '../services/health.service.js';

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  const snapshot = await getHealthSnapshot();
  res.status(snapshot.statusCode).json(snapshot.payload);
};
