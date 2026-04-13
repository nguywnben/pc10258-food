import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OrderCreatePayload {
  address_id?: number | null;
  payment_method: string;
  note?: string;
  promo_code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);

  createOrder(payload: OrderCreatePayload): Observable<any> {
    return this.http.post(`${environment.apiUrl}/orders`, payload);
  }
}
