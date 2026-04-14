import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

export interface User {
  id: number;
  name?: string | null;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  membership?: 'free' | 'premium' | null;
  created_at?: string | null;
}

interface ApiResponse<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:3000/api';

  getAll(): Observable<User[]> {
    return this.http
      .get<ApiResponse<User[]>>(`${this.apiBaseUrl}/users`)
      .pipe(map((response) => response.data ?? []));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<{ message?: string }>(`${this.apiBaseUrl}/users/${id}`)
      .pipe(map(() => undefined));
  }
}
