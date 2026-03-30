import { Injectable, computed, inject, signal } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import type { ApiResponse } from '../models/api.model';
import type { AuthPayload, LoginRequest, PublicUser, SignupRequest } from '../models/auth.model';

const AUTH_TOKEN_KEY = 'inventory_auth_token';
const AUTH_USER_KEY = 'inventory_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClientService);

  private readonly tokenState = signal<string | null>(localStorage.getItem(AUTH_TOKEN_KEY));
  private readonly userState = signal<PublicUser | null>(this.readStoredUser());

  readonly token = computed(() => this.tokenState());
  readonly user = computed(() => this.userState());
  readonly isAuthenticated = computed(() => Boolean(this.tokenState()));

  signup(payload: SignupRequest): Observable<AuthPayload> {
    return this.api
      .post<LoginRequest, ApiResponse<AuthPayload>>('/api/v1/auth/signup', payload)
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.error.message);
          }
          return response.data;
        }),
        tap((data) => this.persistSession(data))
      );
  }

  login(payload: LoginRequest): Observable<AuthPayload> {
    return this.api
      .post<LoginRequest, ApiResponse<AuthPayload>>('/api/v1/auth/login', payload)
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.error.message);
          }
          return response.data;
        }),
        tap((data) => this.persistSession(data))
      );
  }

  demoLogin(): Observable<AuthPayload> {
    return this.api
      .post<Record<string, never>, ApiResponse<AuthPayload>>('/api/v1/auth/demo-login', {})
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.error.message);
          }
          return response.data;
        }),
        tap((data) => this.persistSession(data))
      );
  }

  me(): Observable<PublicUser | null> {
    return this.api
      .getWrapped<{ user: PublicUser }>('/api/v1/auth/me')
      .pipe(
        map((response) => {
          if (!response.success) {
            return null;
          }
          return response.data.user;
        }),
        tap((user) => {
          if (user) {
            this.userState.set(user);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
          }
        })
      );
  }

  logout(): void {
    this.tokenState.set(null);
    this.userState.set(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }

  private persistSession(payload: AuthPayload): void {
    this.tokenState.set(payload.token);
    this.userState.set(payload.user);
    localStorage.setItem(AUTH_TOKEN_KEY, payload.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload.user));
  }

  private readStoredUser(): PublicUser | null {
    const stored = localStorage.getItem(AUTH_USER_KEY);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as PublicUser;
    } catch {
      return null;
    }
  }
}
