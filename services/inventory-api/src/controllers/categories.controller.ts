import { Request, Response } from 'express';
import { createHttpError } from '../middleware/error-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import {
  categoryHasProducts,
  createCategory,
  deleteCategory,
  findCategoryByNameInsensitive,
  listCategories,
  updateCategory,
} from '../services/categories.service.js';

const extractPgErrorCode = (error: unknown): string => {
  if (!error || typeof error !== 'object') {
    return '';
  }

  const directCode = 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  if (directCode) {
    return directCode;
  }

  const nestedKeys = ['originalError', 'nativeError', 'cause'];
  for (const key of nestedKeys) {
    if (key in error) {
      const nested = (error as Record<string, unknown>)[key];
      const nestedCode = extractPgErrorCode(nested);
      if (nestedCode) {
        return nestedCode;
      }
    }
  }

  return '';
};

export const listCategoriesHandler = async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 10);
  const search = String(req.query.search ?? '').trim();
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;

  const result = await listCategories({ page, pageSize, search, status: status as 'active' | 'inactive' | undefined });
  sendSuccess(res, result);
};

export const createCategoryHandler = async (req: Request, res: Response): Promise<void> => {
  const duplicate = await findCategoryByNameInsensitive(req.body.name);
  if (duplicate) {
    throw createHttpError(409, 'Category name already exists', 'CATEGORY_NAME_EXISTS');
  }

  const category = await createCategory(req.body, req.user?.userId ?? null);
  sendSuccess(res, category, 201);
};

export const updateCategoryHandler = async (req: Request, res: Response): Promise<void> => {
  const categoryId = String(req.params.id);

  if (typeof req.body?.name === 'string') {
    const duplicate = await findCategoryByNameInsensitive(req.body.name);
    if (duplicate && duplicate.id !== categoryId) {
      throw createHttpError(409, 'Category name already exists', 'CATEGORY_NAME_EXISTS');
    }
  }

  if (req.body?.is_active === false) {
    const hasProducts = await categoryHasProducts(categoryId);
    if (hasProducts) {
      throw createHttpError(
        409,
        'This category has products and cannot be set inactive',
        'CATEGORY_IN_USE'
      );
    }
  }

  const category = await updateCategory(categoryId, req.body, req.user?.userId ?? null);
  if (!category) {
    throw createHttpError(404, 'Category not found');
  }

  sendSuccess(res, category);
};

export const deleteCategoryHandler = async (req: Request, res: Response): Promise<void> => {
  const categoryId = String(req.params.id);

  const inUse = await categoryHasProducts(categoryId);
  if (inUse) {
    throw createHttpError(409, 'This category has products and cannot be deleted', 'CATEGORY_IN_USE');
  }

  try {
    const deleted = await deleteCategory(categoryId, req.user?.userId ?? null);
    if (!deleted) {
      throw createHttpError(404, 'Category not found');
    }

    sendSuccess(res, { deleted: true });
  } catch (error) {
    const pgErrorCode = extractPgErrorCode(error);

    if (pgErrorCode === '23503') {
      throw createHttpError(409, 'This category has products and cannot be deleted', 'CATEGORY_IN_USE');
    }

    throw error;
  }
};
