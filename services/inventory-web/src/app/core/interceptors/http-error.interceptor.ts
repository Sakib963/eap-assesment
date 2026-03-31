import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const httpErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message =
        typeof error.error?.error?.message === 'string'
          ? error.error.error.message
          : 'Unexpected request failure';

      console.error(`[HTTP ${req.method}] ${req.url} -> ${message}`);

      // Handle 401 Unauthorized for authenticated app requests.
      const isAuthAttempt = /\/api\/v1\/auth\/(login|signup|demo-login)(\?.*)?$/.test(req.url);
      if (error.status === 401 && !isAuthAttempt) {
        console.warn('Session expired. Logging out...');
        authService.logout();
        if (!router.url.startsWith('/auth/login')) {
          void router.navigateByUrl('/auth/login');
        }
      }

      return throwError(() => error);
    })
  );
};
