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

export interface CurrentMembership {
  id: number;
  name: string;
  price: number;
  features?: string[];
}

export interface UpgradeResponse {
  status: number;
  message: string;
  data?: {
    membership_id: number;
    plan_name: string;
    upgrade_price: number;
  };
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

  /**
   * Get current membership of user
   * GET /api/membership/current
   */
  getCurrentMembership(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/membership/current`);
  }

  /**
   * Upgrade membership to a plan
   * POST /api/membership/upgrade
   */
  upgrade(planId: number): Observable<UpgradeResponse> {
    return this.http.post<UpgradeResponse>(`${environment.apiUrl}/membership/upgrade`, { plan_id: planId });
  }
}
