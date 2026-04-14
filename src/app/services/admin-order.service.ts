import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class AdminOrderService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiUrl;

  private getAuthHeaders(): { Authorization: string } | undefined {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }

  getAllOrders(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ApiResponse<any[]>>(`${this.apiBaseUrl}/admin/orders`, { headers })
      .pipe(map(response => response.data || []));
  }

  updateOrderStatus(orderId: number, status: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<ApiResponse<any>>(`${this.apiBaseUrl}/admin/orders/${orderId}/status`, { status }, { headers })
      .pipe(map(response => response.data));
  }
}
