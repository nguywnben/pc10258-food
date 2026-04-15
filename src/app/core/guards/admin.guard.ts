import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const redirectHome = () => inject(Router).parseUrl('/');

/** Đọc role trong payload JWT (fallback khi object user trong storage thiếu role). */
function roleFromJwt(token: string | null): string | null {
  if (!token) {
    return null;
  }
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { role?: string };
    return json.role ?? null;
  } catch {
    return null;
  }
}

function effectiveAdminRole(auth: AuthService): string | null | undefined {
  const fromUser = auth.user()?.role;
  if (fromUser) {
    return fromUser;
  }
  return roleFromJwt(auth.getToken());
}

const isAdminRole = (role: string | null | undefined): boolean => role?.toLowerCase() === 'admin';

function checkAdminAccess(): boolean | ReturnType<typeof redirectHome> {
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const role = effectiveAdminRole(authService);
  if (!authService.isAuthenticated() || !isAdminRole(role)) {
    return redirectHome();
  }

  return true;
}

export const adminGuard: CanActivateFn = () => checkAdminAccess();

export const adminChildGuard: CanActivateChildFn = () => checkAdminAccess();
