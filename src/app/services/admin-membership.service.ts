import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { environment } from '../../environments/environment';

export interface MembershipPlan {
  id?: number;
  name: string;
  price: number;
  features?: string[] | null;
  is_popular?: number;
  created_at?: string;
}

interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class AdminMembershipService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/membership-plans`;

  private getAuthHeaders(): { Authorization: string } | undefined {
    const token = this.auth.getToken();
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }

  getAllPlans(): Observable<MembershipPlan[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ApiResponse<MembershipPlan[]>>(this.baseUrl, { headers })
      .pipe(map(response => response.data || []));
  }

  createPlan(data: MembershipPlan): Observable<MembershipPlan> {
    const headers = this.getAuthHeaders();
    return this.http.post<ApiResponse<MembershipPlan>>(this.baseUrl, data, { headers })
      .pipe(map(response => response.data));
  }

  updatePlan(id: number, data: Partial<MembershipPlan>): Observable<MembershipPlan> {
    const headers = this.getAuthHeaders();
    return this.http.put<ApiResponse<MembershipPlan>>(`${this.baseUrl}/${id}`, data, { headers })
      .pipe(map(response => response.data));
  }

  deletePlan(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.baseUrl}/${id}`, { headers })
      .pipe(map(() => undefined));
  }
}
