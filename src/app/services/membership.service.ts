import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MembershipPlan {
  id: number;
  name: string;
  price: number;
  features: string[];
  is_popular: number;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MembershipService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/membership-plans`;

  getMembershipPlans(): Observable<any> {
    return this.http.get(`${this.baseUrl}`);
  }

  upgrade(planId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/membership/upgrade`, { plan_id: planId });
  }
}
