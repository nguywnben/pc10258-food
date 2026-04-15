import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const redirectHome = () => inject(Router).parseUrl('/');

const isAdmin = (role: string | null | undefined): boolean => role?.toLowerCase() === 'admin';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const user = authService.user();

  if (!authService.isAuthenticated() || !isAdmin(user?.role)) {
    return redirectHome();
  }

  return true;
};

export const adminChildGuard: CanActivateChildFn = () => {
  const authService = inject(AuthService);
  const user = authService.user();

  if (!authService.isAuthenticated() || !isAdmin(user?.role)) {
    return redirectHome();
  }

  return true;
};
