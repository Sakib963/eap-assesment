import type { Request, Response } from 'express';
import { sendSuccess } from '../utils/api-response.js';
import { getDashboardMetrics } from '../services/dashboard.service.js';

export const getDashboardHandler = async (_req: Request, res: Response): Promise<void> => {
  const metrics = await getDashboardMetrics();
  sendSuccess(res, metrics);
};
