import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
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
      .pipe(map((response) => this.unwrap(response)), catchError((error) => this.handleApiError(error)));
  }

  createCategory(payload: CreateCategoryPayload): Observable<Category> {
    return this.api
      .post<CreateCategoryPayload, ApiResponse<Category>>('/api/v1/categories', payload)
      .pipe(map((response) => this.unwrap(response)), catchError((error) => this.handleApiError(error)));
  }

  updateCategory(id: string, payload: UpdateCategoryPayload): Observable<Category> {
    return this.api
      .put<UpdateCategoryPayload, ApiResponse<Category>>(`/api/v1/categories/${id}`, payload)
      .pipe(map((response) => this.unwrap(response)), catchError((error) => this.handleApiError(error)));
  }

  deleteCategory(id: string): Observable<{ deleted: boolean }> {
    return this.api
      .delete<ApiResponse<{ deleted: boolean }>>(`/api/v1/categories/${id}`)
      .pipe(map((response) => this.unwrap(response)), catchError((error) => this.handleApiError(error)));
  }

  listProducts(params: ProductListParams): Observable<PaginatedResponse<Product>> {
    return this.api
      .getWrapped<PaginatedResponse<Product>>('/api/v1/products', params)
      .pipe(map((response) => this.unwrap(response)), catchError((error) => this.handleApiError(error)));
  }

  createProduct(payload: CreateProductPayload): Observable<Product> {
    return this.api
      .post<CreateProductPayload, ApiResponse<Product>>('/api/v1/products', payload)
      .pipe(map((response) => this.unwrap(response)), catchError((error) => this.handleApiError(error)));
  }

  updateProduct(id: string, payload: UpdateProductPayload): Observable<Product> {
    return this.api
      .put<UpdateProductPayload, ApiResponse<Product>>(`/api/v1/products/${id}`, payload)
      .pipe(map((response) => this.unwrap(response)), catchError((error) => this.handleApiError(error)));
  }

  deleteProduct(id: string): Observable<{ deleted: boolean }> {
    return this.api
      .delete<ApiResponse<{ deleted: boolean }>>(`/api/v1/products/${id}`)
      .pipe(map((response) => this.unwrap(response)), catchError((error) => this.handleApiError(error)));
  }

  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.error.message);
    }
    return response.data;
  }

  private handleApiError(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = this.extractBackendErrorMessage(error);
      return throwError(() => new Error(backendMessage));
    }

    if (error instanceof Error) {
      return throwError(() => error);
    }

    return throwError(() => new Error('Unexpected request failure'));
  }

  private extractBackendErrorMessage(error: HttpErrorResponse): string {
    const payload = error.error as
      | { error?: { message?: unknown }; message?: unknown }
      | undefined;

    const messageFromApiError = payload?.error?.message;
    if (typeof messageFromApiError === 'string' && messageFromApiError.trim()) {
      return messageFromApiError;
    }

    const messageFromPayload = payload?.message;
    if (typeof messageFromPayload === 'string' && messageFromPayload.trim()) {
      return messageFromPayload;
    }

    return error.message || 'Unexpected request failure';
  }
}
