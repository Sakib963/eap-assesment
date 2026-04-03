import { Router } from 'express';
import { listActivityLogsHandler } from '../controllers/activity-log.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const activityLogRouter = Router();

activityLogRouter.use(requireAuth, requireRoles(['manager']));
activityLogRouter.get('/', asyncHandler(listActivityLogsHandler));

export default activityLogRouter;
