import { Router } from 'express';
import {
  createCategoryHandler,
  deleteCategoryHandler,
  listCategoriesHandler,
  updateCategoryHandler,
} from '../controllers/categories.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCategorySchema,
  deleteCategorySchema,
  listCategoriesSchema,
  updateCategorySchema,
} from '../schemas/catalog.schema.js';

const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

// GET is accessible to all authenticated users (manager and salesman)
categoriesRouter.get('/', validate(listCategoriesSchema), asyncHandler(listCategoriesHandler));

// POST/PUT/DELETE require manager role
categoriesRouter.use(requireRoles(['manager']));
categoriesRouter.post('/', validate(createCategorySchema), asyncHandler(createCategoryHandler));
categoriesRouter.put('/:id', validate(updateCategorySchema), asyncHandler(updateCategoryHandler));
categoriesRouter.delete('/:id', validate(deleteCategorySchema), asyncHandler(deleteCategoryHandler));

export default categoriesRouter;
