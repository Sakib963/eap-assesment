import { Router } from 'express';
import {
  createOrderHandler,
  getOrderByIdHandler,
  listOrdersHandler,
  updateOrderStatusHandler,
} from '../controllers/orders.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createOrderSchema,
  getOrderByIdSchema,
  listOrdersSchema,
  updateOrderStatusSchema,
} from '../schemas/orders.schema.js';

const ordersRouter = Router();

ordersRouter.use(requireAuth);

ordersRouter.get('/', validate(listOrdersSchema), asyncHandler(listOrdersHandler));
ordersRouter.get('/:id', validate(getOrderByIdSchema), asyncHandler(getOrderByIdHandler));
ordersRouter.post('/', validate(createOrderSchema), asyncHandler(createOrderHandler));
ordersRouter.put('/:id/status', validate(updateOrderStatusSchema), asyncHandler(updateOrderStatusHandler));

export default ordersRouter;
