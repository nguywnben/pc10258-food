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
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="w-full max-w-md rounded-3xl bg-white shadow-2xl p-8 text-center border border-gray-100 animate-in fade-in zoom-in duration-500">
        <!-- Success Icon -->
        <div class="w-24 h-24 mx-auto mb-8 rounded-full bg-green-50 flex items-center justify-center shadow-inner">
          <div class="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-200">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>

        @if (!isConfirming() || paymentType()) {
          <!-- Status Message -->
          <h1 class="text-3xl font-extrabold text-slate-900 mb-2">
            @switch (paymentType()) {
              @case ('order') {
                Thanh toán thành công!
              }
              @case ('upgrade') {
                Nâng cấp thành công!
              }
              @case ('deposit') {
                Nạp tiền thành công!
              }
              @default {
                Giao dịch thành công!
              }
            }
          </h1>
          <p class="text-slate-500 mb-8 font-medium">{{ statusMessage() }}</p>

          <!-- Amount Display -->
          @if (amount()) {
            <div class="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100">
              <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {{ paymentType() === 'order' ? 'Tổng thanh toán' : 'Số tiền giao dịch' }}
              </p>
              <p class="text-4xl font-black text-slate-900">{{ formatPrice(amount()) }}</p>
            </div>
          }

          <!-- Transaction Details -->
          <div class="bg-slate-50/50 rounded-2xl p-5 mb-8 text-left text-sm border border-slate-100 space-y-4">
            @if (paymentId()) {
              <div class="flex justify-between items-center">
                <span class="text-slate-500 font-medium">Mã giao dịch</span>
                <span class="font-bold text-slate-700">#{{ paymentId() }}</span>
              </div>
            }
            
            @if (paymentType() === 'order' && orderId()) {
              <div class="flex justify-between items-center">
                <span class="text-slate-500 font-medium">Mã đơn hàng</span>
                <span class="font-bold text-blue-600">#{{ orderId() }}</span>
              </div>
            }

            @if (paymentType() === 'deposit' && walletBalance() !== null) {
              <div class="flex justify-between items-center">
                <span class="text-slate-500 font-medium">Số dư hiện tại</span>
                <span class="font-bold text-green-600">{{ formatPrice(walletBalance()) }}</span>
              </div>
            }

            @if (confirmTime()) {
              <div class="flex justify-between items-center">
                <span class="text-slate-500 font-medium">Thời gian</span>
                <span class="font-bold text-slate-700">{{ confirmTime() | date: 'HH:mm, dd/MM/yyyy' }}</span>
              </div>
            }
          </div>

          <!-- Action Buttons -->
          <div class="grid gap-4">
            @if (paymentType() === 'order') {
              <button
                type="button"
                (click)="goToOrders()"
                class="w-full rounded-2xl bg-slate-900 px-6 py-4 text-base font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
              >
                Theo dõi đơn hàng
              </button>
            } @else {
              <button
                type="button"
                (click)="goToWallet()"
                class="w-full rounded-2xl bg-brand px-6 py-4 text-base font-bold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover hover:scale-[1.02] active:scale-[0.98]"
              >
                Về ví của tôi
              </button>
            }

            <button
              type="button"
              (click)="goToHome()"
              class="w-full rounded-2xl border border-slate-200 bg-white px-6 py-4 text-base font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300"
            >
              Về trang chủ
            </button>
          </div>
        } @else {
          <!-- Loading State -->
          <div class="py-12 flex flex-col items-center justify-center">
            <div class="flex gap-2 mb-4">
              <div class="w-2 h-2 rounded-full bg-brand animate-bounce"></div>
              <div class="w-2 h-2 rounded-full bg-brand animate-bounce [animation-delay:0.2s]"></div>
              <div class="w-2 h-2 rounded-full bg-brand animate-bounce [animation-delay:0.4s]"></div>
            </div>
            <p class="text-base font-bold text-slate-400">{{ confirmMessage() }}</p>
          </div>
        }
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
  paymentType = signal<'deposit' | 'order' | 'upgrade' | null>(null);
  orderId = signal<number | null>(null);
  walletBalance = signal<number | null>(null);
  statusMessage = signal<string>('Vui lòng đợi giây lát...');
  confirmMessage = signal<string>('Đang xác thực giao dịch...');

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
        if (response.data.amount) {
          this.amount.set(response.data.amount);
        }

        if (response.data.type) {
          this.paymentType.set(response.data.type);
        }

        if (response.data.order_id) {
          this.orderId.set(response.data.order_id);
        }

        if (response.data.wallet_balance !== undefined) {
          this.walletBalance.set(response.data.wallet_balance);
        }

        if (this.paymentType() === 'order') {
          this.statusMessage.set('Đơn hàng của bạn đang được xử lý');
        } else if (this.paymentType() === 'upgrade') {
          this.statusMessage.set('Tài khoản của bạn đã được nâng cấp');
        } else if (this.paymentType() === 'deposit') {
          this.statusMessage.set('Số dư ví của bạn đã được cập nhật');
        } else {
          this.statusMessage.set('Giao dịch của bạn đã hoàn tất');
        }
        
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

  goToOrders(): void {
    this.router.navigate(['/account/orders']);
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }

  formatPrice(price: number | null | undefined): string {
    if (price === null || price === undefined) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }
}
