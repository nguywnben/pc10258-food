import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class AdminPromotionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/promotions`;

  getAllPromotions(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  createPromotion(data: Promotion): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  updatePromotion(id: number, data: Partial<Promotion>): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  deletePromotion(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
