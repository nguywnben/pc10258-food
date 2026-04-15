import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const redirectHome = () => inject(Router).parseUrl('/');

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.isAuthenticated() ? true : redirectHome();
};

export const authChildGuard: CanActivateChildFn = () => {
  const authService = inject(AuthService);
  return authService.isAuthenticated() ? true : redirectHome();
};
