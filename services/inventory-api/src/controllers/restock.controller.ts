import { Request, Response } from 'express';
import { createHttpError } from '../middleware/error-handler.js';
import { listRestockQueue, markRestockCompleted, restockProduct, type RestockPriority, type RestockStatus } from '../services/restock.service.js';
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
  const userId = req.user?.userId ?? null;
  const updated = await markRestockCompleted(String(req.params.id), userId);
  if (!updated) {
    throw createHttpError(404, 'Restock queue item not found', 'RESTOCK_ITEM_NOT_FOUND');
  }

  sendSuccess(res, updated);
};

export const restockProductHandler = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const quantityAdded = Number(req.body.quantity_added);
  const userId = req.user?.userId ?? null;

  const updated = await restockProduct(id, quantityAdded, userId);
  if (!updated) {
    throw createHttpError(404, 'Restock queue item not found or already completed', 'RESTOCK_ITEM_NOT_FOUND');
  }

  sendSuccess(res, updated);
};
