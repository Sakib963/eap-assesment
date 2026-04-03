import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models/api.model';

type QueryParams = object;

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl;

  get<T>(path: string, queryParams?: QueryParams): Observable<T> {
    return this.http.get<T>(`${this.apiBase}${path}`, {
      params: this.buildHttpParams(queryParams),
    });
  }

  getWrapped<T>(path: string, queryParams?: QueryParams): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.apiBase}${path}`, {
      params: this.buildHttpParams(queryParams),
    });
  }

  post<TPayload, TResponse>(path: string, payload: TPayload): Observable<TResponse> {
    return this.http.post<TResponse>(`${this.apiBase}${path}`, payload);
  }

  put<TPayload, TResponse>(path: string, payload: TPayload): Observable<TResponse> {
    return this.http.put<TResponse>(`${this.apiBase}${path}`, payload);
  }

  patch<TPayload, TResponse>(path: string, payload: TPayload): Observable<TResponse> {
    return this.http.patch<TResponse>(`${this.apiBase}${path}`, payload);
  }

  delete<TResponse>(path: string): Observable<TResponse> {
    return this.http.delete<TResponse>(`${this.apiBase}${path}`);
  }

  private buildHttpParams(queryParams?: QueryParams): HttpParams | undefined {
    if (!queryParams) {
      return undefined;
    }

    let params = new HttpParams();

    Object.entries(queryParams as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return params;
  }
}
