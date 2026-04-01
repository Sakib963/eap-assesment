import { Router } from 'express';
import { listRestockQueueHandler, markRestockCompletedHandler } from '../controllers/restock.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { listRestockQueueSchema, markRestockCompletedSchema } from '../schemas/orders.schema.js';

const restockRouter = Router();

restockRouter.use(requireAuth);

restockRouter.get('/', validate(listRestockQueueSchema), asyncHandler(listRestockQueueHandler));
restockRouter.put('/:id/complete', validate(markRestockCompletedSchema), asyncHandler(markRestockCompletedHandler));

export default restockRouter;
