import { Request, Response } from 'express';
import { createHttpError } from '../middleware/error-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import {
  createOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
  type OrderStatus,
} from '../services/orders.service.js';

export const listOrdersHandler = async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 10);
  const status = typeof req.query.status === 'string' ? (req.query.status as OrderStatus) : undefined;
  const fromDate = typeof req.query.fromDate === 'string' ? req.query.fromDate : undefined;
  const toDate = typeof req.query.toDate === 'string' ? req.query.toDate : undefined;

  const ownerUserId = req.user?.role === 'salesman' ? req.user.userId : undefined;
  const result = await listOrders({ page, pageSize, status, fromDate, toDate, ownerUserId });
  sendSuccess(res, result);
};

export const getOrderByIdHandler = async (req: Request, res: Response): Promise<void> => {
  const ownerUserId = req.user?.role === 'salesman' ? req.user.userId : undefined;
  const order = await getOrderById(String(req.params.id), ownerUserId);
  if (!order) {
    throw createHttpError(404, 'Order not found', 'ORDER_NOT_FOUND');
  }

  sendSuccess(res, order);
};

export const createOrderHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    throw createHttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const order = await createOrder({
    userId: req.user.userId,
    customer_name: String(req.body.customer_name ?? ''),
    customer_phone: String(req.body.customer_phone ?? ''),
    customer_address: req.body.customer_address ?? null,
    delivery_instruction: req.body.delivery_instruction ?? null,
    discount_amount: Number(req.body.discount_amount ?? 0),
    items: req.body.items,
  });

  sendSuccess(res, order, 201);
};

export const updateOrderStatusHandler = async (req: Request, res: Response): Promise<void> => {
  const orderId = String(req.params.id);
  const status = String(req.body.status) as OrderStatus;
  const userId = req.user?.userId ?? null;
  const ownerUserId = req.user?.role === 'salesman' ? req.user.userId : undefined;

  const updated = await updateOrderStatus(orderId, status, userId, ownerUserId);
  if (!updated) {
    throw createHttpError(404, 'Order not found', 'ORDER_NOT_FOUND');
  }

  sendSuccess(res, updated);
};
