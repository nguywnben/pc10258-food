import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OrderItem {
  id: number;
  product_id?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: {
    id: number;
    name: string;
    image_url?: string;
  };
}

export interface Order {
  id: number;
  order_code: string;
  status: 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
  payment_method: string;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  note?: string;
  created_at: string;
  items?: OrderItem[];
}

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

  getOrders(status?: string): Observable<Order[]> {
    const url = status ? `${environment.apiUrl}/orders?status=${status}` : `${environment.apiUrl}/orders`;
    return this.http.get<{ status: number; data: Order[] }>(url).pipe(
      map(res => res.data)
    );
  }

  cancelOrder(id: number): Observable<any> {
    return this.http.put(`${environment.apiUrl}/orders/${id}/cancel`, {});
  }

  createOrder(payload: OrderCreatePayload): Observable<any> {
    return this.http.post(`${environment.apiUrl}/orders`, payload);
  }
}
