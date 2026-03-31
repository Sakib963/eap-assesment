export type ProductStatus = 'active' | 'out_of_stock' | 'inactive';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
}

export interface CategoryListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string | null;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string | null;
}

export interface CreateProductPayload {
  category_id: string;
  name: string;
  description?: string | null;
  price: number;
  current_stock: number;
  min_stock_threshold: number;
  is_active?: boolean;
}

export interface UpdateProductPayload {
  category_id?: string;
  name?: string;
  description?: string | null;
  price?: number;
  current_stock?: number;
  min_stock_threshold?: number;
  is_active?: boolean;
}
