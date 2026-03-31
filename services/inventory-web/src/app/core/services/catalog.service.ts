import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { ApiResponse } from '../models/api.model';
import type {
  Category,
  CategoryListParams,
  CreateCategoryPayload,
  CreateProductPayload,
  PaginatedResponse,
  Product,
  ProductListParams,
  UpdateCategoryPayload,
  UpdateProductPayload,
} from '../models/catalog.model';
import { ApiClientService } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly api = inject(ApiClientService);

  listCategories(params: CategoryListParams): Observable<PaginatedResponse<Category>> {
    return this.api
      .getWrapped<PaginatedResponse<Category>>('/api/v1/categories', params)
      .pipe(map((response) => this.unwrap(response)));
  }

  createCategory(payload: CreateCategoryPayload): Observable<Category> {
    return this.api
      .post<CreateCategoryPayload, ApiResponse<Category>>('/api/v1/categories', payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  updateCategory(id: string, payload: UpdateCategoryPayload): Observable<Category> {
    return this.api
      .put<UpdateCategoryPayload, ApiResponse<Category>>(`/api/v1/categories/${id}`, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  deleteCategory(id: string): Observable<{ deleted: boolean }> {
    return this.api
      .delete<ApiResponse<{ deleted: boolean }>>(`/api/v1/categories/${id}`)
      .pipe(map((response) => this.unwrap(response)));
  }

  listProducts(params: ProductListParams): Observable<PaginatedResponse<Product>> {
    return this.api
      .getWrapped<PaginatedResponse<Product>>('/api/v1/products', params)
      .pipe(map((response) => this.unwrap(response)));
  }

  createProduct(payload: CreateProductPayload): Observable<Product> {
    return this.api
      .post<CreateProductPayload, ApiResponse<Product>>('/api/v1/products', payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  updateProduct(id: string, payload: UpdateProductPayload): Observable<Product> {
    return this.api
      .put<UpdateProductPayload, ApiResponse<Product>>(`/api/v1/products/${id}`, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  deleteProduct(id: string): Observable<{ deleted: boolean }> {
    return this.api
      .delete<ApiResponse<{ deleted: boolean }>>(`/api/v1/products/${id}`)
      .pipe(map((response) => this.unwrap(response)));
  }

  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.error.message);
    }
    return response.data;
  }
}
