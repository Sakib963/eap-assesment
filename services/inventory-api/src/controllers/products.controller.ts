import { Request, Response } from 'express';
import { createHttpError } from '../middleware/error-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import { getCategoryAssignmentStatus } from '../services/categories.service.js';
import { createProduct, getProductById, listProducts, updateProduct } from '../services/products.service.js';

const ensureCategoryAssignable = async (categoryId: string): Promise<void> => {
  const categoryStatus = await getCategoryAssignmentStatus(categoryId);

  if (!categoryStatus.exists) {
    throw createHttpError(400, 'Category not found', 'CATEGORY_NOT_FOUND');
  }

  if (!categoryStatus.isActive) {
    throw createHttpError(409, 'Category is inactive and cannot be used for products', 'CATEGORY_INACTIVE');
  }
};

const ensureStockStatusConsistency = (payload: { status?: string; current_stock?: number }, mode: 'create' | 'update'): void => {
  const hasStatus = typeof payload.status === 'string';
  const hasStock = typeof payload.current_stock === 'number';

  if (!hasStatus) {
    return;
  }

  if (payload.status === 'inactive') {
    return;
  }

  if (payload.status === 'active' && hasStock && (payload.current_stock as number) <= 0) {
    throw createHttpError(400, 'Active products must have stock greater than zero', 'INVALID_ACTIVE_STOCK');
  }

  if (mode === 'update' && payload.status === 'active' && !hasStock) {
    throw createHttpError(
      400,
      'Please provide current stock greater than zero when setting product status to active',
      'MISSING_ACTIVE_STOCK_FOR_UPDATE'
    );
  }

  if (payload.status === 'out_of_stock' && hasStock && (payload.current_stock as number) > 0) {
    throw createHttpError(
      400,
      'Out of Stock products must have stock equal to zero',
      'INVALID_OUT_OF_STOCK_VALUE'
    );
  }

  if (mode === 'create' && payload.status === 'active' && !hasStock) {
    throw createHttpError(400, 'Current stock is required for active products', 'MISSING_ACTIVE_STOCK');
  }
};

export const listProductsHandler = async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 10);
  const search = String(req.query.search ?? '').trim();
  const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined;
  const status = req.query.status ? String(req.query.status) : undefined;

  const result = await listProducts({
    page,
    pageSize,
    search,
    categoryId,
    status: status as 'active' | 'out_of_stock' | 'inactive' | undefined,
  });

  sendSuccess(res, result);
};

export const getProductByIdHandler = async (req: Request, res: Response): Promise<void> => {
  const product = await getProductById(String(req.params.id));
  if (!product) {
    throw createHttpError(404, 'Product not found');
  }

  sendSuccess(res, product);
};

export const createProductHandler = async (req: Request, res: Response): Promise<void> => {
  await ensureCategoryAssignable(String(req.body.category_id));
  ensureStockStatusConsistency(req.body as { status?: string; current_stock?: number }, 'create');

  const product = await createProduct(req.body, req.user?.userId ?? null);
  sendSuccess(res, product, 201);
};

export const updateProductHandler = async (req: Request, res: Response): Promise<void> => {
  if (typeof req.body?.category_id === 'string') {
    await ensureCategoryAssignable(req.body.category_id);
  }
  ensureStockStatusConsistency(req.body as { status?: string; current_stock?: number }, 'update');

  const product = await updateProduct(String(req.params.id), req.body, req.user?.userId ?? null);
  if (!product) {
    throw createHttpError(404, 'Product not found');
  }

  sendSuccess(res, product);
};
