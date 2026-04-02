import db from '../config/database.js';
import { logActivity } from './activity-log.service.js';
import { syncRestockQueueForProduct } from './stock-rules.service.js';

export type ProductStatus = 'active' | 'out_of_stock' | 'inactive';

export interface ProductRecord {
  id: string;
  category_id: string;
  category_name?: string;
  name: string;
  description: string | null;
  price: string | number;
  current_stock: number;
  min_stock_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductView {
  id: string;
  category_id: string;
  category_name?: string;
  name: string;
  description: string | null;
  price: number;
  current_stock: number;
  min_stock_threshold: number;
  is_active: boolean;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

interface ProductFilters {
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
  page: number;
  pageSize: number;
}

const mapStatus = (row: ProductRecord): ProductStatus => {
  if (!row.is_active) {
    return 'inactive';
  }
  return row.current_stock <= 0 ? 'out_of_stock' : 'active';
};

const mapProduct = (row: ProductRecord): ProductView => ({
  ...row,
  price: Number(row.price),
  status: mapStatus(row),
});

export const listProducts = async (filters: ProductFilters): Promise<{ items: ProductView[]; total: number; page: number; pageSize: number }> => {
  const { search = '', categoryId, status, page, pageSize } = filters;
  const offset = (page - 1) * pageSize;

  const baseQuery = db('products as p')
    .leftJoin('categories as c', 'p.category_id', 'c.id')
    .modify((builder) => {
      if (search) {
        builder.where((inner) => {
          inner.whereILike('p.name', `%${search}%`).orWhereILike('c.name', `%${search}%`);
        });
      }
      if (categoryId) {
        builder.andWhere('p.category_id', categoryId);
      }
      if (status === 'inactive') {
        builder.andWhere('p.is_active', false);
      }
      if (status === 'out_of_stock') {
        builder.andWhere('p.is_active', true).andWhere('p.current_stock', '<=', 0);
      }
      if (status === 'active') {
        builder.andWhere('p.is_active', true).andWhere('p.current_stock', '>', 0);
      }
    });

  const countResult = await baseQuery
    .clone()
    .countDistinct<{ count: string }>('p.id as count')
    .first();

  const rows = (await baseQuery
    .clone()
    .select(
      'p.id',
      'p.category_id',
      'p.name',
      'p.description',
      'p.price',
      'p.current_stock',
      'p.min_stock_threshold',
      'p.is_active',
      'p.created_at',
      'p.updated_at',
      'c.name as category_name'
    )
    .orderByRaw('LOWER(p.name) ASC')
    .offset(offset)
    .limit(pageSize)) as ProductRecord[];

  return {
    items: rows.map((row) => mapProduct(row as ProductRecord)),
    total: Number(countResult?.count ?? 0),
    page,
    pageSize,
  };
};

export const getProductById = async (id: string): Promise<ProductView | null> => {
  const row = await db('products as p')
    .leftJoin('categories as c', 'p.category_id', 'c.id')
    .select(
      'p.id',
      'p.category_id',
      'p.name',
      'p.description',
      'p.price',
      'p.current_stock',
      'p.min_stock_threshold',
      'p.is_active',
      'p.created_at',
      'p.updated_at',
      'c.name as category_name'
    )
    .where('p.id', id)
    .first();

  if (!row) {
    return null;
  }

  return mapProduct(row as ProductRecord);
};

export const createProduct = async (payload: {
  category_id: string;
  name: string;
  description?: string | null;
  price: number;
  current_stock: number;
  min_stock_threshold: number;
  status?: ProductStatus;
}, userId?: string | null): Promise<ProductView> => {
  const id = await db.transaction(async (trx) => {
    const isActive = payload.status !== 'inactive';
    const stock = payload.status === 'out_of_stock' ? 0 : payload.current_stock;

    const inserted = await trx<ProductRecord>('products')
      .insert({
        category_id: payload.category_id,
        name: payload.name,
        description: payload.description ?? null,
        price: payload.price,
        current_stock: stock,
        min_stock_threshold: payload.min_stock_threshold,
        is_active: isActive,
      })
      .returning(['id']);

    const insertedId = (inserted[0] as { id: string }).id;

    await syncRestockQueueForProduct(trx, {
      id: insertedId,
      name: payload.name,
      current_stock: stock,
      min_stock_threshold: payload.min_stock_threshold,
      is_active: isActive,
    });

    return insertedId;
  });

  const product = await getProductById(id);
  if (!product) {
    throw new Error('PRODUCT_CREATE_FAILED');
  }

  void logActivity({
    user_id: userId ?? null,
    action: `Product "${product.name}" created`,
    entity_type: 'product',
    entity_id: id,
  });

  return product;
};

export const updateProduct = async (
  id: string,
  payload: {
    category_id?: string;
    name?: string;
    description?: string | null;
    price?: number;
    current_stock?: number;
    min_stock_threshold?: number;
    status?: ProductStatus;
  },
  userId?: string | null
): Promise<ProductView | null> => {
  const updated = await db.transaction(async (trx) => {
    const existing = await trx<ProductRecord>('products').where({ id }).first();
    if (!existing) {
      return false;
    }

    const nextPayload: Record<string, unknown> = {
      updated_at: db.fn.now(),
    };

    if (payload.category_id !== undefined) nextPayload.category_id = payload.category_id;
    if (payload.name !== undefined) nextPayload.name = payload.name;
    if (payload.description !== undefined) nextPayload.description = payload.description;
    if (payload.price !== undefined) nextPayload.price = payload.price;
    if (payload.min_stock_threshold !== undefined) nextPayload.min_stock_threshold = payload.min_stock_threshold;

    if (payload.current_stock !== undefined) {
      nextPayload.current_stock = payload.current_stock;
    }
    if (payload.status === 'inactive') {
      nextPayload.is_active = false;
    }
    if (payload.status === 'active' || payload.status === 'out_of_stock') {
      nextPayload.is_active = true;
    }
    if (payload.status === 'out_of_stock') {
      nextPayload.current_stock = 0;
    }

    await trx<ProductRecord>('products').where({ id }).update(nextPayload);

    const refreshed = await trx<ProductRecord>('products')
      .where({ id })
      .first('id', 'name', 'current_stock', 'min_stock_threshold', 'is_active');

    if (refreshed) {
      await syncRestockQueueForProduct(trx, {
        id: refreshed.id,
        name: refreshed.name,
        current_stock: refreshed.current_stock,
        min_stock_threshold: refreshed.min_stock_threshold,
        is_active: refreshed.is_active,
      });
    }

    return true;
  });

  if (!updated) {
    return null;
  }

  const product = await getProductById(id);
  if (!product) {
    return null;
  }

  const action = payload.status
    ? `Product "${product.name}" status changed to ${payload.status}`
    : `Product "${product.name}" updated`;

  void logActivity({
    user_id: userId ?? null,
    action,
    entity_type: 'product',
    entity_id: id,
  });

  return product;
};
