import { Router } from 'express';
import { getDashboardHandler } from '../controllers/dashboard.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/auth.js';

const dashboardRouter = Router();

dashboardRouter.use(requireAuth);
dashboardRouter.get('/', asyncHandler(getDashboardHandler));

export default dashboardRouter;
