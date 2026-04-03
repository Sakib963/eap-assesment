import { Router } from 'express';
import {
  createProductHandler,
  getProductByIdHandler,
  listProductsHandler,
  updateProductHandler,
} from '../controllers/products.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProductSchema,
  getProductByIdSchema,
  listProductsSchema,
  updateProductSchema,
} from '../schemas/catalog.schema.js';

const productsRouter = Router();

productsRouter.use(requireAuth);

productsRouter.get('/', validate(listProductsSchema), asyncHandler(listProductsHandler));
productsRouter.get('/:id', validate(getProductByIdSchema), asyncHandler(getProductByIdHandler));
productsRouter.post('/', requireRoles(['manager']), validate(createProductSchema), asyncHandler(createProductHandler));
productsRouter.put('/:id', requireRoles(['manager']), validate(updateProductSchema), asyncHandler(updateProductHandler));

export default productsRouter;
