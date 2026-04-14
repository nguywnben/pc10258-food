import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaymentPayload {
  amount: number;
  description: string;
  return_url: string;
  cancel_url: string;
}

export interface WalletPaymentPayload {
  amount: number;
  type?: 'order' | 'upgrade';
  order_id?: number;
  description?: string;
}

export interface PaymentConfirmPayload {
  transaction_code?: string;  // Optional - backend can generate if not provided
  plan_id?: number;           // Required for membership upgrade payments
}

export interface Payment {
  id: number;
  user_id: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method: string;
  transaction_code?: string;
  checkout_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentResponse {
  status: number;
  data: Payment;
  message?: string;
}

export interface WalletPaymentResponse {
  status: number;
  message: string;
  data: {
    payment_id: number;
    reference_code: string;
    new_balance: number;
    amount_paid: number;
  };
}

export interface PaymentCheckoutResponse {
  status: number;
  data: {
    id: number;
    checkout_url: string;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/payments`;

  /**
   * Create a payment for wallet deposit
   * POST /api/payments
   */
  createPayment(payload: PaymentPayload): Observable<PaymentCheckoutResponse> {
    return this.http.post<PaymentCheckoutResponse>(`${this.baseUrl}`, payload);
  }

  /**
   * Confirm payment after successful PayOS transaction
   * PUT /api/payments/:id/confirm
   */
  confirmPayment(paymentId: number | string, payload: PaymentConfirmPayload): Observable<PaymentResponse> {
    return this.http.put<PaymentResponse>(`${this.baseUrl}/${paymentId}/confirm`, payload);
  }

  /**
   * Get payment status
   * GET /api/payments/:id
   */
  getPaymentStatus(paymentId: number): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.baseUrl}/${paymentId}`);
  }

  /**
   * Get user's payment history
   * GET /api/payments
   */
  getPaymentHistory(): Observable<{ status: number; data: Payment[] }> {
    return this.http.get<{ status: number; data: Payment[] }>(`${this.baseUrl}`);
  }

  /**
   * Pay using wallet balance
   * POST /api/payments/wallet
   */
  payWithWallet(payload: WalletPaymentPayload): Observable<WalletPaymentResponse> {
    return this.http.post<WalletPaymentResponse>(`${this.baseUrl}/wallet`, payload);
  }
}
