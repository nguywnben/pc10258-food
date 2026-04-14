import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

export interface Product {
  id: number;
  name: string;
  image_url: string | null;
  price: number;
  created_at: string;
}

interface ApiResponse<T> {
  data: T;
}

export interface CreateProductPayload {
  name: string;
  image_url: string;
  price: number;
}

export interface UpdateProductPayload {
  name: string;
  image_url: string;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:3000/api';

  private getAuthHeaders(): { Authorization: string } | undefined {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }

  getAll(): Observable<Product[]> {
    return this.http
      .get<ApiResponse<Product[]>>(`${this.apiBaseUrl}/products`)
      .pipe(map((response) => response.data ?? []));
  }

  getById(id: number): Observable<Product> {
    return this.http
      .get<ApiResponse<Product>>(`${this.apiBaseUrl}/products/${id}`)
      .pipe(map((response) => response.data));
  }

  create(payload: CreateProductPayload): Observable<Product> {
    const headers = this.getAuthHeaders();

    return this.http
      .post<ApiResponse<Product>>(`${this.apiBaseUrl}/products`, payload, { headers })
      .pipe(map((response) => response.data));
  }

  update(id: number, payload: UpdateProductPayload): Observable<Product> {
    const headers = this.getAuthHeaders();

    return this.http
      .put<ApiResponse<Product>>(`${this.apiBaseUrl}/products/${id}`, payload, { headers })
      .pipe(map((response) => response.data));
  }

  delete(id: number): Observable<void> {
    const headers = this.getAuthHeaders();

    return this.http
      .delete<{ message?: string }>(`${this.apiBaseUrl}/products/${id}`, { headers })
      .pipe(map(() => undefined));
  }
}
