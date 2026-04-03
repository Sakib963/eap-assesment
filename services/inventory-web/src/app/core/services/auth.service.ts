import { Injectable, computed, inject, signal } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import type { ApiResponse } from '../models/api.model';
import type {
  AuthPayload,
  ForgotPasswordRequestPayload,
  ForgotPasswordResetPayload,
  ForgotPasswordVerifyPayload,
  LoginRequest,
  PublicUser,
  SignupRequest,
} from '../models/auth.model';

const AUTH_TOKEN_KEY = 'inventory_auth_token';
const AUTH_USER_KEY = 'inventory_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClientService);

  private readonly tokenState = signal<string | null>(this.readStoredToken());
  private readonly userState = signal<PublicUser | null>(this.readStoredUser());

  readonly token = computed(() => this.tokenState());
  readonly user = computed(() => this.userState());
  readonly isAuthenticated = computed(() => Boolean(this.tokenState()));
  readonly isManager = computed(() => this.userState()?.role === 'manager');
  readonly isSalesman = computed(() => this.userState()?.role === 'salesman');

  hasValidSession(): boolean {
    const token = this.tokenState();
    if (!token) {
      return false;
    }

    const isValid = this.isTokenValid(token);
    if (!isValid) {
      this.logout();
      return false;
    }

    return true;
  }

  signup(payload: SignupRequest): Observable<AuthPayload> {
    return this.api
      .post<SignupRequest, ApiResponse<AuthPayload>>('/api/v1/auth/signup', payload)
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

  requestForgotPassword(payload: ForgotPasswordRequestPayload): Observable<{ email_exists: boolean }> {
    return this.api
      .post<ForgotPasswordRequestPayload, ApiResponse<{ email_exists: boolean }>>(
        '/api/v1/auth/forgot-password/request',
        payload
      )
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.error.message);
          }
          return response.data;
        })
      );
  }

  verifyForgotPasswordOtp(payload: ForgotPasswordVerifyPayload): Observable<{ verified: boolean }> {
    return this.api
      .post<ForgotPasswordVerifyPayload, ApiResponse<{ verified: boolean }>>(
        '/api/v1/auth/forgot-password/verify',
        payload
      )
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.error.message);
          }
          return response.data;
        })
      );
  }

  resetForgotPassword(payload: ForgotPasswordResetPayload): Observable<{ reset: boolean }> {
    return this.api
      .post<ForgotPasswordResetPayload, ApiResponse<{ reset: boolean }>>(
        '/api/v1/auth/forgot-password/reset',
        payload
      )
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.error.message);
          }
          return response.data;
        })
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
          } else {
            this.userState.set(null);
            localStorage.removeItem(AUTH_USER_KEY);
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
      localStorage.removeItem(AUTH_USER_KEY);
      return null;
    }
  }

  private readStoredToken(): string | null {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!storedToken) {
      return null;
    }

    if (!this.isTokenValid(storedToken)) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      return null;
    }

    return storedToken;
  }

  private isTokenValid(token: string): boolean {
    try {
      const [, payloadPart] = token.split('.');
      if (!payloadPart) {
        return false;
      }

      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const payload = JSON.parse(atob(padded)) as { exp?: number };

      if (typeof payload.exp !== 'number') {
        return false;
      }

      return payload.exp > Math.floor(Date.now() / 1000);
    } catch {
      return false;
    }
  }
}
