import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaymentService, PaymentCheckoutResponse } from '../../services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-wallet-deposit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" *ngIf="isOpen()">
      <div class="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 sm:p-7">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-ink">Nạp tiền vào ví</h2>
          <button 
            type="button"
            (click)="close()"
            class="text-ink-light hover:text-ink transition"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Amount Selection -->
          <div>
            <label class="block text-sm font-bold text-ink mb-3">Chọn mệnh giá</label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                type="button"
                *ngFor="let preset of presets"
                (click)="selectPreset(preset)"
                [class.border-brand]="selectedAmount() === preset"
                [class.bg-brand/5]="selectedAmount() === preset"
                [class.border-gray-100]="selectedAmount() !== preset"
                [class.bg-gray-50/50]="selectedAmount() !== preset"
                class="rounded-xl border-2 px-3 py-3 text-center text-sm font-semibold text-ink transition hover:border-brand/40 hover:bg-brand/5"
              >
                {{ formatPrice(preset) }}
              </button>
            </div>
          </div>

          <!-- Custom Amount -->
          <div>
            <label for="custom-amount" class="block text-sm font-bold text-ink mb-2">Hoặc nhập số tiền khác (₫)</label>
            <input
              id="custom-amount"
              name="custom-amount"
              type="number"
              inputmode="numeric"
              min="2000"
              max="50000000"
              step="1000"
              [(ngModel)]="customAmount"
              (ngModelChange)="onAmountChange($event)"
              class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base font-semibold text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <p class="mt-2 text-xs text-ink-light">Tối thiểu 2.000₫, tối đa 50.000.000₫</p>
          </div>

          <!-- Payment Method -->
          <fieldset>
            <legend class="text-sm font-bold text-ink mb-3">Phương thức thanh toán</legend>
            <div class="space-y-2">
              <label class="flex cursor-pointer items-start gap-3 rounded-2xl border-2 transition"
                [class.border-brand]="paymentMethod() === 'bank'"
                [class.bg-brand/5]="paymentMethod() === 'bank'"
                [class.border-gray-100]="paymentMethod() !== 'bank'"
                [class.bg-white]="paymentMethod() !== 'bank'"
                class="p-3">
                <input 
                  type="radio" 
                  name="method" 
                  value="bank"
                  (change)="paymentMethod.set('bank')"
                  [checked]="paymentMethod() === 'bank'"
                  class="mt-1 h-4 w-4 shrink-0 border-gray-300 text-brand focus:ring-brand" 
                />
                <span>
                  <span class="block text-sm font-semibold text-ink">PayOS (Ngân hàng)</span>
                  <span class="text-xs text-ink-light">Chuyển khoản QR + nội dung</span>
                </span>
              </label>
            </div>
          </fieldset>

          <!-- Amount Display & Submit Button -->
          <div class="border-t border-gray-100 pt-6">
            <div class="text-center mb-4">
              <p class="text-xs text-ink-light mb-1">Số tiền nạp</p>
              <p class="text-3xl font-bold text-brand">{{ formatPrice(finalAmount()) }}</p>
            </div>
            <button
              type="submit"
              [disabled]="!finalAmount() || isProcessing()"
              class="w-full rounded-xl bg-brand px-4 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ isProcessing() ? 'Đang xử lý...' : 'Thanh toán ' + formatPrice(finalAmount()) }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class WalletDepositModalComponent {
  private readonly router = inject(Router);
  private readonly paymentSvc = inject(PaymentService);
  private readonly authSvc = inject(AuthService);
  private readonly toast = inject(ToastService);

  isOpen = signal(false);
  presets = [50000, 100000, 200000, 500000];
  selectedAmount = signal<number | null>(null);
  customAmount: number | null = null;
  paymentMethod = signal<'bank'>('bank');
  isProcessing = signal(false);

  get finalAmount(): () => number {
    return () => this.customAmount || this.selectedAmount() || 0;
  }

  open(): void {
    this.isOpen.set(true);
    this.reset();
  }

  close(): void {
    this.isOpen.set(false);
  }

  selectPreset(amount: number): void {
    this.selectedAmount.set(amount);
    this.customAmount = null;
  }

  onAmountChange(value: number | null): void {
    if (value) {
      this.selectedAmount.set(null);
    }
  }

  onSubmit(): void {
    const amount = this.finalAmount();
    if (!amount) {
      this.toast.warning('Vui lòng chọn mệnh giá hoặc nhập số tiền');
      return;
    }

    this.isProcessing.set(true);

    // Create payment for wallet deposit via PayOS
    const returnUrl = `${window.location.origin}/payment/success`;
    const cancelUrl = `${window.location.origin}/payment/cancel`;

    this.paymentSvc.createPayment({
      amount,
      description: `Nạp tiền vào ví`,
      return_url: returnUrl,
      cancel_url: cancelUrl
    }).subscribe({
      next: (response: PaymentCheckoutResponse) => {
        this.isProcessing.set(false);
        this.close();
        
        // Store payment_id in sessionStorage for payment-success/cancel pages
        if (response.data.id) {
          sessionStorage.setItem('paymentId', response.data.id.toString());
          sessionStorage.setItem('paymentAmount', amount.toString());
        }
        
        // Redirect directly to PayOS checkout if URL available
        if (response.data.checkout_url) {
          window.location.href = response.data.checkout_url;
        } else {
          this.toast.error('Không nhận được đường link thanh toán');
        }
      },
      error: (err: any) => {
        this.isProcessing.set(false);
        console.error('Payment creation failed:', err);
        
        // Handle 401 Unauthorized
        if (err.status === 401) {
          console.warn('Token expired or invalid. Redirecting to login.');
          this.authSvc.logout();
          this.router.navigate(['/login']);
          return;
        }
        
        this.toast.error(err.error?.message || 'Không thể tạo giao dịch thanh toán');
      }
    });
  }

  private reset(): void {
 
    this.customAmount = null;
    this.paymentMethod.set('bank');
    this.isProcessing.set(false);
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
