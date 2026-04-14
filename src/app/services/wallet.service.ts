import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Wallet {
  id: number;
  user_id: number;
  balance: number;
}

export interface WalletTransaction {
  id: number;
  user_id: number;
  wallet_id: number;
  type: 'deposit' | 'payment' | 'refund' | 'bonus';
  amount: number;
  description: string;
  reference_id?: number;
  balance_after: number;
  created_at: string;
  updated_at: string;
}

export interface WalletResponse {
  status: number;
  data: Wallet;
}

export interface WalletTransactionsResponse {
  status: number;
  data: WalletTransaction[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface DepositPayload {
  amount: number;
  payment_method: string;
}

export interface DepositResponse {
  status: number;
  data: {
    payment_id: number;
    checkout_url: string;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/wallet`;

  /**
   * Get wallet balance
   * GET /api/wallet
   */
  getWallet(): Observable<WalletResponse> {
    return this.http.get<WalletResponse>(`${this.baseUrl}`);
  }

  /**
   * Get wallet transactions history with pagination
   * GET /api/wallet/transactions?limit=5&offset=0
   */
  getTransactions(page: number = 1, limit: number = 5): Observable<WalletTransactionsResponse> {
    const offset = (page - 1) * limit;
    return this.http.get<WalletTransactionsResponse>(`${this.baseUrl}/transactions?limit=${limit}&offset=${offset}`);
  }

  /**
   * Deposit money to wallet (creates payment)
   * POST /api/wallet/deposit
   */
  deposit(payload: DepositPayload): Observable<DepositResponse> {
    return this.http.post<DepositResponse>(`${this.baseUrl}/deposit`, payload);
  }
}
