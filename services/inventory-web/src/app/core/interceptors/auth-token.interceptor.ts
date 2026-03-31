import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  const isApiRequest = req.url.startsWith(environment.apiBaseUrl);
  if (!isApiRequest) {
    return next(req);
  }

  const isAuthAttempt = /\/api\/v1\/auth\/(login|signup|demo-login)(\?.*)?$/.test(req.url);
  if (isAuthAttempt) {
    return next(req);
  }

  if (!token || !authService.hasValidSession()) {
    return next(req);
  }

  const authorizedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authorizedRequest);
};
