import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div class="w-full max-w-md rounded-3xl bg-white shadow-xl p-8 text-center">
        <!-- Cancel Icon -->
        <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <svg class="w-12 h-12 text-red-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>

        <!-- Status Message -->
        <h1 class="text-2xl font-bold text-ink mb-2">Thanh toán bị hủy</h1>
        <p class="text-ink-light mb-8">
          Bạn đã hủy giao dịch thanh toán. Ví của bạn chưa được cập nhật.
        </p>

        <!-- Info Box -->
        <div class="bg-red-50 rounded-2xl border border-red-200 p-4 mb-8">
          <p class="text-sm text-red-700">
         Bạn có thể quay lại và thử nạp tiền lại bất kỳ lúc nào.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <button
            type="button"
            (click)="retry()"
            class="w-full rounded-xl bg-brand px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover"
          >
            Thử nạp lại
          </button>
          <button
            type="button"
            (click)="goToWallet()"
            class="w-full rounded-xl border border-gray-200 bg-white px-6 py-4 text-sm font-semibold text-ink transition hover:bg-gray-50"
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
      </div>
    </div>
  `,
  styles: []
})
export class PaymentCancelComponent implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    // Clean up sessionStorage on load
    sessionStorage.removeItem('paymentId');
    sessionStorage.removeItem('paymentAmount');
  }

  retry(): void {
    // Navigate to wallet and open deposit modal
    this.router.navigate(['/wallet'], { state: { openDepositModal: true } });
  }

  goToWallet(): void {
    this.router.navigate(['/wallet']);
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }
}
