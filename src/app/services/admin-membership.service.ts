import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MembershipPlan {
  id?: number;
  name: string;
  min_points: number;
  discount_rate: number;
  benefits?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminMembershipService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/membership-plans`;

  getAllPlans(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  createPlan(data: MembershipPlan): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  updatePlan(id: number, data: Partial<MembershipPlan>): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  deletePlan(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
