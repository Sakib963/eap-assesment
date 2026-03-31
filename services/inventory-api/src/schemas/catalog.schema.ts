import { z } from 'zod';

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const listCategoriesSchema = z.object({
  params: z.object({}),
  body: z.object({}),
  query: paginationSchema.extend({
    search: z.string().trim().optional().default(''),
  }),
});

export const createCategorySchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).optional().nullable(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(500).optional().nullable(),
  }),
});

export const deleteCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}),
  body: z.object({}),
});

export const listProductsSchema = z.object({
  params: z.object({}),
  body: z.object({}),
  query: paginationSchema.extend({
    search: z.string().trim().optional().default(''),
    categoryId: z.string().uuid().optional(),
    status: z.enum(['active', 'out_of_stock', 'inactive']).optional(),
  }),
});

export const getProductByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}),
  body: z.object({}),
});

export const createProductSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: z.object({
    category_id: z.string().uuid(),
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(1000).optional().nullable(),
    price: z.coerce.number().positive(),
    current_stock: z.coerce.number().int().min(0),
    min_stock_threshold: z.coerce.number().int().min(0),
    is_active: z.boolean().optional().default(true),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}),
  body: z.object({
    category_id: z.string().uuid().optional(),
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(1000).optional().nullable(),
    price: z.coerce.number().positive().optional(),
    current_stock: z.coerce.number().int().min(0).optional(),
    min_stock_threshold: z.coerce.number().int().min(0).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const deleteProductSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}),
  body: z.object({}),
});
