import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Promotion {
  id?: number;
  code: string;
  description: string;
  discount_type: 'fixed' | 'percent';
  discount_value: number;
  discount_amount: number;
}

export interface PromoValidateResponse {
  status: number;
  data: Promotion;
}

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private readonly http = inject(HttpClient);

  validatePromo(code: string, orderTotal: number): Observable<PromoValidateResponse> {
    return this.http.post<PromoValidateResponse>(`${environment.apiUrl}/promotions/validate`, {
      code,
      order_total: orderTotal
    });
  }
}
