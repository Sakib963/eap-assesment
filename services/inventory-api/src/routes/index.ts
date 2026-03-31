import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import categoriesRouter from './categories.routes.js';
import { healthRouter } from './health.routes.js';
import productsRouter from './products.routes.js';
import { systemRouter } from './system.routes.js';

export const apiRouter = Router();
export const v1Router = Router();

v1Router.use('/system', systemRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/categories', categoriesRouter);
v1Router.use('/products', productsRouter);

apiRouter.use(healthRouter);
apiRouter.use('/v1', v1Router);
