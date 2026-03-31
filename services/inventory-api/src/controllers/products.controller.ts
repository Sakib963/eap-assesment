import { Request, Response } from 'express';
import { createHttpError } from '../middleware/error-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import { getCategoryAssignmentStatus } from '../services/categories.service.js';
import { createProduct, deleteProduct, getProductById, listProducts, updateProduct } from '../services/products.service.js';

const ensureCategoryAssignable = async (categoryId: string): Promise<void> => {
  const categoryStatus = await getCategoryAssignmentStatus(categoryId);

  if (!categoryStatus.exists) {
    throw createHttpError(400, 'Category not found', 'CATEGORY_NOT_FOUND');
  }

  if (!categoryStatus.isActive) {
    throw createHttpError(409, 'Category is inactive and cannot be used for products', 'CATEGORY_INACTIVE');
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

  const product = await createProduct(req.body);
  sendSuccess(res, product, 201);
};

export const updateProductHandler = async (req: Request, res: Response): Promise<void> => {
  if (typeof req.body?.category_id === 'string') {
    await ensureCategoryAssignable(req.body.category_id);
  }

  const product = await updateProduct(String(req.params.id), req.body);
  if (!product) {
    throw createHttpError(404, 'Product not found');
  }

  sendSuccess(res, product);
};

export const deleteProductHandler = async (req: Request, res: Response): Promise<void> => {
  const deleted = await deleteProduct(String(req.params.id));
  if (!deleted) {
    throw createHttpError(404, 'Product not found');
  }

  sendSuccess(res, { deleted: true });
};
