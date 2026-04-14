import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Promotion {
  id?: number;
  code: string;
  description?: string;
  discount_type: 'percent' | 'fixed' | 'freeship';
  discount_value: number;
  min_order_value?: number;
  start_date?: string;
  end_date?: string;
  max_uses?: number;
  used_count?: number;
  is_active?: boolean;
}

interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class AdminPromotionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/promotions`;

  private getAuthHeaders(): { Authorization: string } | undefined {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }

  getAllPromotions(): Observable<Promotion[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ApiResponse<Promotion[]>>(this.baseUrl, { headers })
      .pipe(map(response => response.data || []));
  }

  createPromotion(data: Promotion): Observable<Promotion> {
    const headers = this.getAuthHeaders();
    return this.http.post<ApiResponse<Promotion>>(this.baseUrl, data, { headers })
      .pipe(map(response => response.data));
  }

  updatePromotion(id: number, data: Partial<Promotion>): Observable<Promotion> {
    const headers = this.getAuthHeaders();
    return this.http.put<ApiResponse<Promotion>>(`${this.baseUrl}/${id}`, data, { headers })
      .pipe(map(response => response.data));
  }

  deletePromotion(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.baseUrl}/${id}`, { headers })
      .pipe(map(() => undefined));
  }
}
