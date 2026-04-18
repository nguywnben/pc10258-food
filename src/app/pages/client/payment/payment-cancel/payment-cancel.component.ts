import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mx-auto w-full max-w-2xl space-y-6 py-12">
      <section class="rounded-3xl border border-gray-100 bg-white p-6 sm:p-7 text-center">
        <div class="space-y-4">
          <div class="flex justify-center">
            <svg class="h-12 w-12 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-ink">Nạp tiền không thành công</h2>
          <p class="text-sm text-ink-light">Bạn đã hủy giao dịch. Số dư ví của bạn chưa được cập nhật.</p>
          <div class="mt-6 flex gap-3 justify-center">
            <button
              type="button"
              (click)="goToWallet()"
              class="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-ink hover:bg-gray-50"
            >
              Quay lại ví
            </button>
            <button
              type="button"
              (click)="retry()"
              class="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-hover"
            >
              Thử nạp lại
            </button>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: []
})
export class PaymentCancelComponent implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    // Clean up sessionStorage on load (Browser only)
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('paymentId');
      sessionStorage.removeItem('paymentAmount');
    }
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
