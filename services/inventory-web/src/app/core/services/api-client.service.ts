import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl;

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.apiBase}${path}`);
  }

  getWrapped<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.apiBase}${path}`);
  }

  post<TPayload, TResponse>(path: string, payload: TPayload): Observable<TResponse> {
    return this.http.post<TResponse>(`${this.apiBase}${path}`, payload);
  }
}
