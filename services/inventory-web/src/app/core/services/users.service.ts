import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import type { ApiResponse } from '../models/api.model';
import type { PaginatedResponse } from '../models/catalog.model';
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserListParams,
  UserRecord,
  UserStatus,
} from '../models/users.model';
import { ApiClientService } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly api = inject(ApiClientService);

  listUsers(params: UserListParams): Observable<PaginatedResponse<UserRecord>> {
    return this.api
      .getWrapped<PaginatedResponse<UserRecord>>('/api/v1/users', params)
      .pipe(map((response) => this.unwrap(response)), catchError((error) => this.handleApiError(error)));
  }

  createUser(payload: CreateUserPayload): Observable<UserRecord> {
    return this.api
      .post<CreateUserPayload, ApiResponse<UserRecord>>('/api/v1/users', payload)
      .pipe(map((response) => this.unwrap(response)), catchError((error) => this.handleApiError(error)));
  }

  updateUser(id: string, payload: UpdateUserPayload): Observable<UserRecord> {
    return this.api
      .patch<UpdateUserPayload, ApiResponse<UserRecord>>(`/api/v1/users/${id}`, payload)
      .pipe(map((response) => this.unwrap(response)), catchError((error) => this.handleApiError(error)));
  }

  setStatus(id: string, status: UserStatus): Observable<UserRecord> {
    return this.api
      .patch<{ status: UserStatus }, ApiResponse<UserRecord>>(`/api/v1/users/${id}/status`, { status })
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
      const payload = error.error as { error?: { message?: unknown }; message?: unknown } | undefined;
      const message =
        (typeof payload?.error?.message === 'string' && payload.error.message) ||
        (typeof payload?.message === 'string' && payload.message) ||
        error.message ||
        'Unexpected request failure';
      return throwError(() => new Error(message));
    }

    if (error instanceof Error) {
      return throwError(() => error);
    }

    return throwError(() => new Error('Unexpected request failure'));
  }
}
