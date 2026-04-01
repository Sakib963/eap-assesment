import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import type { ApiResponse } from '../models/api.model';
import type { PaginatedResponse } from '../models/catalog.model';
import type {
  CreateOrderPayload,
  Order,
  OrderListParams,
  RestockListParams,
  RestockQueueItem,
  UpdateOrderStatusPayload,
} from '../models/orders.model';
import { ApiClientService } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly api = inject(ApiClientService);

  listOrders(params: OrderListParams): Observable<PaginatedResponse<Order>> {
    return this.api
      .getWrapped<PaginatedResponse<Order>>('/api/v1/orders', params)
      .pipe(map((response) => this.unwrap(response)), catchError((error) => this.handleApiError(error)));
  }

  getOrder(id: string): Observable<Order> {
    return this.api
      .getWrapped<Order>(`/api/v1/orders/${id}`)
      .pipe(map((response) => this.unwrap(response)), catchError((error) => this.handleApiError(error)));
  }

  createOrder(payload: CreateOrderPayload): Observable<Order> {
    return this.api
      .post<CreateOrderPayload, ApiResponse<Order>>('/api/v1/orders', payload)
      .pipe(map((response) => this.unwrap(response)), catchError((error) => this.handleApiError(error)));
  }

  updateOrderStatus(orderId: string, payload: UpdateOrderStatusPayload): Observable<Order> {
    return this.api
      .put<UpdateOrderStatusPayload, ApiResponse<Order>>(`/api/v1/orders/${orderId}/status`, payload)
      .pipe(map((response) => this.unwrap(response)), catchError((error) => this.handleApiError(error)));
  }

  listRestockQueue(params: RestockListParams): Observable<PaginatedResponse<RestockQueueItem>> {
    return this.api
      .getWrapped<PaginatedResponse<RestockQueueItem>>('/api/v1/restock', params)
      .pipe(map((response) => this.unwrap(response)), catchError((error) => this.handleApiError(error)));
  }

  markRestockCompleted(id: string): Observable<RestockQueueItem> {
    return this.api
      .put<Record<string, never>, ApiResponse<RestockQueueItem>>(`/api/v1/restock/${id}/complete`, {})
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
      const payload = error.error as
        | { error?: { message?: unknown }; message?: unknown }
        | undefined;

      const messageFromApiError = payload?.error?.message;
      if (typeof messageFromApiError === 'string' && messageFromApiError.trim()) {
        return throwError(() => new Error(messageFromApiError));
      }

      const messageFromPayload = payload?.message;
      if (typeof messageFromPayload === 'string' && messageFromPayload.trim()) {
        return throwError(() => new Error(messageFromPayload));
      }

      return throwError(() => new Error(error.message || 'Unexpected request failure'));
    }

    if (error instanceof Error) {
      return throwError(() => error);
    }

    return throwError(() => new Error('Unexpected request failure'));
  }
}
