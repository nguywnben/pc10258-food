import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../../../services/payment.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-brand/5 to-brand/10 flex items-center justify-center p-4">
      <div class="w-full max-w-md rounded-3xl bg-white shadow-xl p-8 text-center">
        <!-- Success Icon -->
        <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>

        <!-- Status Message -->
        <h1 class="text-2xl font-bold text-ink mb-2">Nạp tiền thành công!</h1>
        <p class="text-ink-light mb-6">{{ statusMessage() }}</p>

        <!-- Amount Display -->
        <div class="bg-brand/10 rounded-2xl p-4 mb-6" *ngIf="amount()">
          <p class="text-sm text-ink-light mb-1">Số tiền nạp</p>
          <p class="text-3xl font-bold text-brand">{{ formatPrice(amount()) }}</p>
        </div>

        <!-- Transaction Details -->
        <div class="bg-gray-50 rounded-2xl p-4 mb-6 text-left text-sm">
          <div class="flex justify-between mb-3" *ngIf="paymentId()">
            <span class="text-ink-light">ID giao dịch:</span>
            <span class="font-mono text-ink">{{ paymentId() }}</span>
          </div>
          <div class="flex justify-between" *ngIf="confirmTime()">
            <span class="text-ink-light">Thời gian:</span>
            <span class="text-ink">{{ confirmTime() | date: 'HH:mm:ss, dd/MM/yyyy' }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <button
            type="button"
            (click)="goToWallet()"
            class="w-full rounded-xl bg-brand px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover"
          >
            Về trang ví
          </button>
          <button
            type="button"
            (click)="goToHome()"
            class="w-full rounded-xl border border-gray-200 bg-white px-6 py-4 text-sm font-semibold text-ink transition hover:bg-gray-50"
          >
            Quay về trang chủ
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="isConfirming()" class="mt-4 text-center">
          <p class="text-sm text-ink-light">{{ confirmMessage() }}</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PaymentSuccessComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly paymentSvc = inject(PaymentService);
  private readonly authSvc = inject(AuthService);

  paymentId = signal<number | null>(null);
  amount = signal<number>(0);
  confirmTime = signal<Date | null>(null);
  isConfirming = signal(false);
  statusMessage = signal<string>('Ví của bạn đã được cập nhật');
  confirmMessage = signal<string>('Đang xác nhận giao dịch...');

  ngOnInit(): void {
    // Try to get payment_id from sessionStorage (set by modal)
    let storedPaymentId = sessionStorage.getItem('paymentId');
    let storedAmount = sessionStorage.getItem('paymentAmount');
    
    if (storedPaymentId) {
      this.paymentId.set(parseInt(storedPaymentId, 10));
    }
    
    if (storedAmount) {
      this.amount.set(parseInt(storedAmount, 10));
    }
    
    // Check query params for PayOS callback
    this.route.queryParams.subscribe(params => {
      // Check if payment is cancelled (PayOS returns cancel params to returnUrl)
      const status = params['status'];
      const isCancelled = params['cancel'] === 'true' || status === 'CANCELLED';
      
      if (isCancelled) {
        // Redirect to cancel page
        this.router.navigate(['/payment/cancel']);
        return;
      }
      
      // Check for payment_id in params
      if (params['payment_id'] && !storedPaymentId) {
        this.paymentId.set(parseInt(params['payment_id'], 10));
        this.confirmPayment(parseInt(params['payment_id'], 10));
      } else if (storedPaymentId) {
        // Confirm using stored payment_id
        this.confirmPayment(parseInt(storedPaymentId, 10));
      }
    });

    // Also check navigation state (from modal redirect)
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      const state = navigation.extras.state;
      if (state['amount']) {
        this.amount.set(state['amount']);
      }
    }
  }

  private confirmPayment(paymentId: number): void {
    this.isConfirming.set(true);

    this.paymentSvc.confirmPayment(paymentId, {}).subscribe({
      next: (response) => {
        this.isConfirming.set(false);
        this.confirmTime.set(new Date());
        
        // Update amount from response if available
        if ('amount' in response.data) {
          this.amount.set((response.data as any).amount);
        }

        this.statusMessage.set('Tiền đã được cộng vào ví của bạn');
        
        // Clean up sessionStorage
        sessionStorage.removeItem('paymentId');
        sessionStorage.removeItem('paymentAmount');
      },
      error: (err: any) => {
        this.isConfirming.set(false);
        console.error('Payment confirmation failed:', err);
        
        // Handle 401 Unauthorized
        if (err.status === 401) {
          console.warn('Token expired. Redirecting to login.');
          this.authSvc.logout();
          this.router.navigate(['/login']);
          return;
        }

        this.statusMessage.set('Đã xác nhận giao dịch (lưu ý: có thể mất vài phút để cập nhật)');
        
        // Clean up sessionStorage
        sessionStorage.removeItem('paymentId');
        sessionStorage.removeItem('paymentAmount');
      }
    });
  }

  goToWallet(): void {
    this.router.navigate(['/wallet']);
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }
}
