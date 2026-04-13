import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

interface ApiResponse<T> {
  data: T;
}

export interface CreateCategoryPayload {
  name: string;
  icon: string | null;
  sort_order: number;
}

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:3000/api';

  getAll(): Observable<Category[]> {
    return this.http
      .get<ApiResponse<Category[]>>(`${this.apiBaseUrl}/categories`)
      .pipe(map((response) => response.data ?? []));
  }

  create(payload: CreateCategoryPayload): Observable<Category> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    return this.http
      .post<ApiResponse<Category>>(`${this.apiBaseUrl}/categories`, payload, { headers })
      .pipe(map((response) => response.data));
  }
}