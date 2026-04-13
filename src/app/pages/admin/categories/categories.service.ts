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

export interface UpdateCategoryPayload {
  name: string;
  icon: string | null;
  sort_order: number;
}

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:3000/api';

  private getAuthHeaders(): { Authorization: string } | undefined {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }

  getAll(): Observable<Category[]> {
    return this.http
      .get<ApiResponse<Category[]>>(`${this.apiBaseUrl}/categories`)
      .pipe(map((response) => response.data ?? []));
  }

  getById(id: number): Observable<Category> {
    return this.http
      .get<ApiResponse<Category>>(`${this.apiBaseUrl}/categories/${id}`)
      .pipe(map((response) => response.data));
  }

  create(payload: CreateCategoryPayload): Observable<Category> {
    const headers = this.getAuthHeaders();

    return this.http
      .post<ApiResponse<Category>>(`${this.apiBaseUrl}/categories`, payload, { headers })
      .pipe(map((response) => response.data));
  }

  update(id: number, payload: UpdateCategoryPayload): Observable<Category> {
    const headers = this.getAuthHeaders();

    return this.http
      .put<ApiResponse<Category>>(`${this.apiBaseUrl}/categories/${id}`, payload, { headers })
      .pipe(map((response) => response.data));
  }
}