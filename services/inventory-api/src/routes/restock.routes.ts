import { Router } from 'express';
import { listRestockQueueHandler, markRestockCompletedHandler, restockProductHandler } from '../controllers/restock.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { listRestockQueueSchema, markRestockCompletedSchema, restockProductSchema } from '../schemas/orders.schema.js';

const restockRouter = Router();

restockRouter.use(requireAuth, requireRoles(['manager']));

restockRouter.get('/', validate(listRestockQueueSchema), asyncHandler(listRestockQueueHandler));
restockRouter.put('/:id/complete', validate(markRestockCompletedSchema), asyncHandler(markRestockCompletedHandler));
restockRouter.put('/:id/restock', validate(restockProductSchema), asyncHandler(restockProductHandler));

export default restockRouter;
