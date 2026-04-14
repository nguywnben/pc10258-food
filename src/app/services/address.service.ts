import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Address {
  id: number;
  user_id: number;
  label: string;
  full_address: string;
  is_default: number;
}

export interface AddressResponse {
  status: number;
  data: Address[];
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private readonly http = inject(HttpClient);

  getAddresses(): Observable<AddressResponse> {
    return this.http.get<AddressResponse>(`${environment.apiUrl}/addresses`);
  }
}
