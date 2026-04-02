import { z } from 'zod';

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const listOrdersSchema = z.object({
  params: z.object({}),
  body: z.object({}),
  query: paginationSchema.extend({
    status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
    fromDate: isoDateSchema.optional(),
    toDate: isoDateSchema.optional(),
  }),
});

export const getOrderByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}),
  body: z.object({}),
});

const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1),
});

export const createOrderSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: z.object({
    customer_name: z.string().trim().min(2).max(120),
    customer_phone: z.string().trim().min(7).max(30),
    customer_address: z.string().trim().max(255).optional().nullable(),
    delivery_instruction: z.string().trim().max(500).optional().nullable(),
    discount_amount: z.coerce.number().min(0).optional().default(0),
    items: z.array(orderItemSchema).min(1),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}),
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  }),
});

export const listRestockQueueSchema = z.object({
  params: z.object({}),
  body: z.object({}),
  query: paginationSchema.extend({
    status: z.enum(['pending', 'completed']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }),
});

export const markRestockCompletedSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}),
  body: z.object({}),
});

export const restockProductSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}),
  body: z.object({
    quantity_added: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  }),
});
