import type { Request, Response } from 'express';
import { sendSuccess } from '../utils/api-response.js';
import { listActivityLogs } from '../services/activity-log.service.js';

export const listActivityLogsHandler = async (req: Request, res: Response): Promise<void> => {
  const parsedPage = Number(req.query.page ?? 1);
  const page = Number.isFinite(parsedPage) ? Math.max(1, Math.floor(parsedPage)) : 1;

  const parsedPageSize = Number(req.query.pageSize ?? req.query.limit ?? 10);
  const pageSize = Number.isFinite(parsedPageSize) ? Math.min(Math.max(Math.floor(parsedPageSize), 1), 100) : 10;

  const fromDate = typeof req.query.fromDate === 'string' && req.query.fromDate.trim() ? req.query.fromDate : undefined;
  const toDate = typeof req.query.toDate === 'string' && req.query.toDate.trim() ? req.query.toDate : undefined;

  const logs = await listActivityLogs({ page, pageSize, fromDate, toDate });
  sendSuccess(res, logs);
};
