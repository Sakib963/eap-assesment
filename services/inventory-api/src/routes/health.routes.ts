import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const healthRouter = Router();

// Keep legacy payload shape for frontend bootstrap compatibility.
healthRouter.get('/health', asyncHandler(getHealth));
