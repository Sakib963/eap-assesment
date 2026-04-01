import { Request, Response } from 'express';
import { createHttpError } from '../middleware/error-handler.js';
import { listRestockQueue, markRestockCompleted, type RestockPriority, type RestockStatus } from '../services/restock.service.js';
import { sendSuccess } from '../utils/api-response.js';

export const listRestockQueueHandler = async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 10);
  const status = typeof req.query.status === 'string' ? (req.query.status as RestockStatus) : undefined;
  const priority = typeof req.query.priority === 'string' ? (req.query.priority as RestockPriority) : undefined;

  const result = await listRestockQueue({
    page,
    pageSize,
    status,
    priority,
  });

  sendSuccess(res, result);
};

export const markRestockCompletedHandler = async (req: Request, res: Response): Promise<void> => {
  const updated = await markRestockCompleted(String(req.params.id));
  if (!updated) {
    throw createHttpError(404, 'Restock queue item not found', 'RESTOCK_ITEM_NOT_FOUND');
  }

  sendSuccess(res, updated);
};
