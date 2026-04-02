import { Router } from 'express';
import { listActivityLogsHandler } from '../controllers/activity-log.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.js';

const activityLogRouter = Router();

activityLogRouter.use(requireAuth);
activityLogRouter.get('/', asyncHandler(listActivityLogsHandler));

export default activityLogRouter;
