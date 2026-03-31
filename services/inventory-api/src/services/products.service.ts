import db from '../config/database.js';

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
  if (!row.is_active) return 'inactive';
  if (row.current_stock <= 0) return 'out_of_stock';
  return 'active';
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
    .orderBy('p.created_at', 'desc')
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
  is_active?: boolean;
}): Promise<ProductView> => {
  const inserted = await db<ProductRecord>('products')
    .insert({
      category_id: payload.category_id,
      name: payload.name,
      description: payload.description ?? null,
      price: payload.price,
      current_stock: payload.current_stock,
      min_stock_threshold: payload.min_stock_threshold,
      is_active: payload.is_active ?? true,
    })
    .returning(['id']);

  const id = (inserted[0] as { id: string }).id;
  const product = await getProductById(id);
  if (!product) {
    throw new Error('PRODUCT_CREATE_FAILED');
  }
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
    is_active?: boolean;
  }
): Promise<ProductView | null> => {
  const updatedRows = await db<ProductRecord>('products')
    .where({ id })
    .update({
      ...payload,
      updated_at: db.fn.now(),
    });

  if (!updatedRows) {
    return null;
  }

  return getProductById(id);
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  const deletedRows = await db<ProductRecord>('products').where({ id }).del();
  return deletedRows > 0;
};
