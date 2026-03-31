import { Request, Response } from 'express';
import { createHttpError } from '../middleware/error-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../services/categories.service.js';

export const listCategoriesHandler = async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 10);
  const search = String(req.query.search ?? '').trim();

  const result = await listCategories({ page, pageSize, search });
  sendSuccess(res, result);
};

export const createCategoryHandler = async (req: Request, res: Response): Promise<void> => {
  const category = await createCategory(req.body);
  sendSuccess(res, category, 201);
};

export const updateCategoryHandler = async (req: Request, res: Response): Promise<void> => {
  const category = await updateCategory(String(req.params.id), req.body);
  if (!category) {
    throw createHttpError(404, 'Category not found');
  }

  sendSuccess(res, category);
};

export const deleteCategoryHandler = async (req: Request, res: Response): Promise<void> => {
  const deleted = await deleteCategory(String(req.params.id));
  if (!deleted) {
    throw createHttpError(404, 'Category not found');
  }

  sendSuccess(res, { deleted: true });
};
