import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Wallet {
  id: number;
  user_id: number;
  balance: number;
}

export interface WalletResponse {
  status: number;
  data: Wallet;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private readonly http = inject(HttpClient);

  getWallet(): Observable<WalletResponse> {
    return this.http.get<WalletResponse>(`${environment.apiUrl}/wallet`);
  }
}
