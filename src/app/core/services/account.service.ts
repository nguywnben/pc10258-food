import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AddressListResponse,
  AddressMutationResponse,
  AddressPayload,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from '../models/account.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly usersApiUrl = 'http://localhost:3000/api/users';
  private readonly addressesApiUrl = 'http://localhost:3000/api/addresses';

  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.usersApiUrl}/profile`);
  }

  updateProfile(payload: UpdateProfileRequest): Observable<UpdateProfileResponse> {
    return this.http.put<UpdateProfileResponse>(`${this.usersApiUrl}/profile`, payload);
  }

  changePassword(payload: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http.put<ChangePasswordResponse>(`${this.usersApiUrl}/change-password`, payload);
  }

  getAddresses(): Observable<AddressListResponse> {
    return this.http.get<AddressListResponse>(this.addressesApiUrl);
  }

  createAddress(payload: AddressPayload): Observable<AddressMutationResponse> {
    return this.http.post<AddressMutationResponse>(this.addressesApiUrl, payload);
  }

  updateAddress(id: number, payload: Partial<AddressPayload>): Observable<AddressMutationResponse> {
    return this.http.put<AddressMutationResponse>(`${this.addressesApiUrl}/${id}`, payload);
  }

  deleteAddress(id: number): Observable<AddressMutationResponse> {
    return this.http.delete<AddressMutationResponse>(`${this.addressesApiUrl}/${id}`);
  }
}