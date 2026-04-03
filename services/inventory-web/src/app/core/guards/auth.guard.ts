import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import type { UserRole } from '../models/auth.model';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasValidSession()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};

export const guestOnlyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.hasValidSession()) {
    return true;
  }

  return router.createUrlTree(['/']);
};

export const roleGuard = (allowed: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.hasValidSession()) {
      return router.createUrlTree(['/auth/login']);
    }

    const role = authService.user()?.role;
    if (!role || !allowed.includes(role)) {
      return router.createUrlTree(['/']);
    }

    return true;
  };
};
