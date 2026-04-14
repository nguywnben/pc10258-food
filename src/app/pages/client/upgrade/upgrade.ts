import { AfterViewInit, Component, OnInit, signal, inject, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MembershipService, MembershipPlan, CurrentMembership } from '../../../services/membership.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-upgrade',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upgrade.html',
})
export class Upgrade implements OnInit, AfterViewInit {
  private readonly membershipSvc = inject(MembershipService);
  private readonly authSvc = inject(AuthService);
  private readonly router = inject(Router);
  
  plans = signal<MembershipPlan[]>([]);
  currentMembership = signal<CurrentMembership | null>(null);
  isLoading = signal(false);
  isUpgrading = signal(false);
  error = signal<string | null>(null);

  // Computed: Check if user has current membership
  hasCurrentMembership = computed(() => this.currentMembership() !== null);

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authSvc.isAuthenticated()) {
      console.warn('User not authenticated. Redirecting to login.');
      this.router.navigate(['/login']);
      return;
    }

    this.loadData();
  }

  /**
   * Load membership plans and current membership together
   */
  loadData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Load membership plans
    this.membershipSvc.getMembershipPlans().subscribe({
      next: (response: any) => {
        const data = Array.isArray(response) ? response : response.data;
        this.plans.set(data || []);
        console.log('✅ Membership plans loaded:', data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load membership plans:', err);
        this.error.set('Không thể tải danh sách gói membership');
        this.isLoading.set(false);
      }
    });

    // Load current membership
    this.membershipSvc.getCurrentMembership().subscribe({
      next: (response: any) => {
        const membership = response.data || response;
        if (membership && membership.id) {
          this.currentMembership.set(membership);
          console.log('✅ Current membership loaded:', membership);
        } else {
          this.currentMembership.set(null);
          console.log('ℹ️ User has no current membership');
        }
      },
      error: (err: any) => {
        // 401/404 is normal if user doesn't have membership yet
        if (err.status === 401 || err.status === 404) {
          console.log('ℹ️ User has no current membership or needs to login');
          this.currentMembership.set(null);
        } else {
          console.error('❌ Failed to load current membership:', err);
          // Don't show error to user, just assume no membership
          this.currentMembership.set(null);
        }
      }
    });
  }

  /**
   * Check if plan can be upgraded to
   * - Can't select current plan
   * - Can't downgrade to lower tier
   * - Can only upgrade to higher tier
   */
  canUpgrade(plan: MembershipPlan): boolean {
    const current = this.currentMembership();
    
    if (!current) {
      // No current membership, can subscribe to any plan
      return true;
    }

    // Can't select current plan
    if (current.id === plan.id) {
      return false;
    }

    // Can only upgrade to higher price (not downgrade)
    if (plan.price <= current.price) {
      return false;
    }

    return true;
  }

  /**
   * Get button text based on upgrade status
   */
  getUpgradeButtonText(plan: MembershipPlan): string {
    const current = this.currentMembership();

    if (!current) {
      return 'Đăng ký';
    }

    if (current.id === plan.id) {
      return 'Gói hiện tại';
    }

    if (plan.price <= current.price) {
      return 'Nâng cấp';
    }

    return 'Nâng cấp ngay';
  }

  /**
   * Upgrade to a membership plan
   */
  upgrade(plan: MembershipPlan): void {
    if (!this.canUpgrade(plan)) {
      const text = this.getUpgradeButtonText(plan);
      console.warn('⚠️ Cannot upgrade to this plan:', text);
      return;
    }

    console.log('🚀 Upgrade started for plan:', plan);
    this.isUpgrading.set(true);

    // Store plan in sessionStorage to ensure it's available on payment page
    sessionStorage.setItem('upgrade_plan', JSON.stringify(plan));
    sessionStorage.setItem('upgrade_amount', plan.price.toString());
    console.log('💾 Stored in sessionStorage:', { plan, amount: plan.price });
    
    // Navigate to payment page
    this.router.navigate(['/payment'], {
      state: {
        type: 'membership-upgrade',
        plan: plan,
        amount: plan.price
      }
    });

    this.isUpgrading.set(false);
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


