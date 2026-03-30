import { Router } from 'express';
import { getMe, getPing, postEcho } from '../controllers/system.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { echoSchema } from '../schemas/system.schema.js';

export const systemRouter = Router();

systemRouter.get('/ping', getPing);
systemRouter.get('/me', requireAuth, getMe);
systemRouter.post('/echo', validate(echoSchema), postEcho);
