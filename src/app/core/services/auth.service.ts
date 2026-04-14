import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, AuthUser } from '../models/auth.model';

interface AuthStorage {
  token: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:3000/api/users';
  private readonly storageKey = 'pc10258_food_auth';

  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<AuthUser | null>(null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());

  constructor() {
    const savedAuth = this.readStoredAuth();
    if (savedAuth) {
      this._token.set(savedAuth.token);
      this._user.set(savedAuth.user);
    }
  }

  login(payload: LoginRequest) {
    return this.http
      .post<LoginResponse>(`${this.apiBaseUrl}/login`, payload)
      .pipe(tap((response) => this.setAuth(response.token, response.user)));
  }

  register(payload: RegisterRequest) {
    return this.http.post<RegisterResponse>(`${this.apiBaseUrl}/register`, payload);
  }

  setAuth(token: string, user: AuthUser): void {
    this._token.set(token);
    this._user.set(user);
    this.writeStoredAuth({ token, user });
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  getToken(): string | null {
    return this._token();
  }

  private readStoredAuth(): AuthStorage | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<AuthStorage>;
      if (typeof parsed.token !== 'string' || !parsed.user) {
        return null;
      }

      return {
        token: parsed.token,
        user: parsed.user,
      };
    } catch {
      return null;
    }
  }

  private writeStoredAuth(data: AuthStorage): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }
}
