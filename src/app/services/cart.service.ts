import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    image_url: string;
  };
}

export interface CartResponse {
  status: number;
  data: {
    items: CartItem[];
    subtotal: number;
    count: number;
  }
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly http = inject(HttpClient);
  private cartUpdatedSource = new Subject<void>();
  cartUpdated$ = this.cartUpdatedSource.asObservable();

  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(`${environment.apiUrl}/cart`);
  }

  updateQuantity(id: number, quantity: number): Observable<any> {
    return this.http.put(`${environment.apiUrl}/cart/${id}`, { quantity }).pipe(
      tap(() => this.cartUpdatedSource.next())
    );
  }

  addToCart(productId: number, quantity: number = 1): Observable<any> {
    return this.http.post(`${environment.apiUrl}/cart`, { product_id: productId, quantity }).pipe(
      tap(() => this.cartUpdatedSource.next())
    );
  }

  clearCart(): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/cart`).pipe(
      tap(() => this.cartUpdatedSource.next())
    );
  }
}
