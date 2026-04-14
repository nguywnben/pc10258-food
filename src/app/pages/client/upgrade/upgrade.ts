import { AfterViewInit, Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MembershipService, MembershipPlan } from '../../../services/membership.service';

@Component({
  selector: 'app-upgrade',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upgrade.html',
})
export class Upgrade implements OnInit, AfterViewInit {
  private readonly membershipSvc = inject(MembershipService);
  private readonly router = inject(Router);
  
  plans = signal<MembershipPlan[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadMembershipPlans();
  }

  loadMembershipPlans(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.membershipSvc.getMembershipPlans().subscribe({
      next: (response: any) => {
        const data = Array.isArray(response) ? response : response.data;
        this.plans.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load membership plans:', err);
        this.error.set('Không thể tải danh sách gói membership');
        this.isLoading.set(false);
      }
    });
  }

  upgrade(plan: MembershipPlan): void {
    this.router.navigate(['/payment'], {
      state: {
        type: 'membership-upgrade',
        plan: plan
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  ngAfterViewInit(): void {
    if (typeof document === 'undefined') return;
    if (document.querySelector('script#food-main-js')) return;

    const script = document.createElement('script');
    script.id = 'food-main-js';
    script.src = 'assets/js/main.js';
    document.body.appendChild(script);
  }
}

