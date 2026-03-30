import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { systemRouter } from './system.routes.js';

export const apiRouter = Router();
export const v1Router = Router();

v1Router.use('/system', systemRouter);

apiRouter.use(healthRouter);
apiRouter.use('/v1', v1Router);
