import { AfterViewInit, Component, OnInit, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MembershipService, MembershipPlan } from '../../../services/membership.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './payment.html',
})
export class Payment implements OnInit, AfterViewInit {
  private readonly router = inject(Router);
  private readonly membershipSvc = inject(MembershipService);

  paymentType = signal<'wallet' | 'membership-upgrade'>('wallet');
  membershipPlan = signal<MembershipPlan | null>(null);
  isProcessing = signal(false);
  agreeConfirm = signal(false);

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      const state = navigation.extras.state;
      this.paymentType.set(state['type'] || 'wallet');
      if (state['plan']) {
        this.membershipPlan.set(state['plan']);
      }
    }
  }

  confirmPayment(): void {
    if (!this.agreeConfirm()) {
      alert('Vui lòng xác nhận thông tin thanh toán');
      return;
    }

    if (this.paymentType() === 'membership-upgrade' && this.membershipPlan()) {
      this.isProcessing.set(true);
      const planId = this.membershipPlan()!.id;

      this.membershipSvc.upgrade(planId).subscribe({
        next: (response: any) => {
          this.isProcessing.set(false);
          console.log('Upgrade successful:', response);
          this.router.navigate(['/upgrade-success']);
        },
        error: (err) => {
          this.isProcessing.set(false);
          console.error('Upgrade failed:', err);
          alert('Nâng cấp thất bại: ' + (err.error?.message || 'Vui lòng thử lại'));
        }
      });
    }
  }

  hasBackLink(): boolean {
    return this.paymentType() !== 'membership-upgrade';
  }

  getBackLink(): string {
    return this.paymentType() === 'wallet' ? '/wallet#nap-tien' : '/upgrade';
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
    if (this.paymentType() === 'wallet' && document.querySelector('script#food-main-js')) return;

    const script = document.createElement('script');
    script.id = 'food-main-js';
    script.src = 'assets/js/main.js';
    document.body.appendChild(script);
  }
}