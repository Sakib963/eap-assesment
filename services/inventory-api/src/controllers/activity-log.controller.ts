import type { Request, Response } from 'express';
import { sendSuccess } from '../utils/api-response.js';
import { listActivityLogs } from '../services/activity-log.service.js';

export const listActivityLogsHandler = async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(Number(req.query.limit ?? 10), 50);
  const logs = await listActivityLogs(limit);
  sendSuccess(res, logs);
};
