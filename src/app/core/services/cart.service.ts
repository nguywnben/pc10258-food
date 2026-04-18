import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  product?: any;
}

export interface CartResponse {
  status: number;
  data: {
    items: CartItem[];
    subtotal: number;
    count: number;
  };
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/cart';

  cartUpdated$ = new Subject<void>();

  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(this.apiUrl);
  }

  addToCart(productId: number, quantity: number = 1): Observable<any> {
    return this.http.post(this.apiUrl, { product_id: productId, quantity }).pipe(
      tap(() => this.notifyCartUpdate())
    );
  }

  updateQuantity(cartItemId: number, quantity: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${cartItemId}`, { quantity }).pipe(
      tap(() => this.notifyCartUpdate())
    );
  }

  removeCartItem(cartItemId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${cartItemId}`).pipe(
      tap(() => this.notifyCartUpdate())
    );
  }

  clearCart(): Observable<any> {
    return this.http.delete(this.apiUrl).pipe(
      tap(() => this.notifyCartUpdate())
    );
  }

  notifyCartUpdate(): void {
    this.cartUpdated$.next();
  }
}
