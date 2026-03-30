import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { healthRouter } from './health.routes.js';
import { systemRouter } from './system.routes.js';

export const apiRouter = Router();
export const v1Router = Router();

v1Router.use('/system', systemRouter);
v1Router.use('/auth', authRouter);

apiRouter.use(healthRouter);
apiRouter.use('/v1', v1Router);
