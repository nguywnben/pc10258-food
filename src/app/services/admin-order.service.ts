import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminOrderResponse {
  status: number;
  data: any[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminOrderService {
  private readonly http = inject(HttpClient);

  getAllOrders(): Observable<AdminOrderResponse> {
    return this.http.get<AdminOrderResponse>(`${environment.apiUrl}/admin/orders`);
  }

  updateOrderStatus(orderId: number, status: string): Observable<any> {
    return this.http.put(`${environment.apiUrl}/admin/orders/${orderId}/status`, { status });
  }
}
