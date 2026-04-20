import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { PaymentService } from '../../../../services/payment.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mx-auto w-full max-w-2xl space-y-6 py-12">
      <section class="rounded-3xl border border-gray-100 bg-white p-6 sm:p-7 text-center">
        <!-- Processing State -->
        <div *ngIf="isConfirming()" class="space-y-4">
          <div class="flex justify-center">
            <svg class="h-12 w-12 animate-spin text-brand" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-ink">Đang xác nhận thanh toán...</h2>
          <p class="text-sm text-ink-light">{{ confirmMessage() }}</p>
        </div>

        <!-- Success State -->
        <div *ngIf="!isConfirming()" class="space-y-4">
          <div class="flex justify-center">
            <svg class="h-12 w-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
          </div>

          <h2 class="text-xl font-bold text-ink">
            <ng-container [ngSwitch]="paymentType()">
              <ng-container *ngSwitchCase="'order'">Thanh toán thành công!</ng-container>
              <ng-container *ngSwitchCase="'upgrade'">Nâng cấp thành công!</ng-container>
              <ng-container *ngSwitchCase="'deposit'">Nạp tiền thành công!</ng-container>
              <ng-container *ngSwitchDefault>Giao dịch thành công!</ng-container>
            </ng-container>
          </h2>
          <p class="text-sm text-ink-light">{{ statusMessage() }}</p>

          <!-- Summary block -->
          <div *ngIf="amount() || paymentId() || orderId() || confirmTime()"
               class="mt-6 space-y-2 rounded-2xl border border-gray-100 bg-gray-50/60 p-4 text-left text-sm">
            <div *ngIf="amount()" class="flex justify-between">
              <span class="text-ink-light">
                {{ paymentType() === 'order' ? 'Tổng thanh toán' : 'Số tiền' }}
              </span>
              <span class="font-bold text-ink">{{ formatPrice(amount()) }}</span>
            </div>
            <div *ngIf="paymentId()" class="flex justify-between">
              <span class="text-ink-light">Mã giao dịch</span>
              <span class="font-semibold text-ink">#{{ paymentId() }}</span>
            </div>
            <div *ngIf="paymentType() === 'order' && orderId()" class="flex justify-between">
              <span class="text-ink-light">Mã đơn hàng</span>
              <span class="font-semibold text-brand">#{{ orderId() }}</span>
            </div>
            <div *ngIf="paymentType() === 'deposit' && walletBalance() !== null" class="flex justify-between">
              <span class="text-ink-light">Số dư ví</span>
              <span class="font-semibold text-green-600">{{ formatPrice(walletBalance()) }}</span>
            </div>
            <div *ngIf="confirmTime()" class="flex justify-between">
              <span class="text-ink-light">Thời gian</span>
              <span class="font-semibold text-ink">{{ confirmTime() | date: 'HH:mm, dd/MM/yyyy' }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-6 flex flex-wrap gap-3 justify-center">
            <ng-container *ngIf="paymentType() === 'order'">
              <a [routerLink]="['/orders']"
                 class="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-hover">
                Theo dõi đơn hàng
              </a>
            </ng-container>
            <ng-container *ngIf="paymentType() !== 'order'">
              <a [routerLink]="['/wallet']"
                 class="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-hover">
                Về ví của tôi
              </a>
            </ng-container>
            <a [routerLink]="['/']"
               class="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-ink hover:bg-gray-50">
              Về trang chủ
            </a>
          </div>
        </div>
      </section>
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
  statusMessage = signal<string>('Giao dịch của bạn đã hoàn tất.');
  confirmMessage = signal<string>('Vui lòng đợi trong giây lát.');

  ngOnInit(): void {
    let storedPaymentId = sessionStorage.getItem('paymentId');
    let storedAmount = sessionStorage.getItem('paymentAmount');

    if (storedPaymentId) {
      this.paymentId.set(parseInt(storedPaymentId, 10));
    }

    if (storedAmount) {
      this.amount.set(parseInt(storedAmount, 10));
    }

    this.route.queryParams.subscribe(params => {
      const status = params['status'];
      const isCancelled = params['cancel'] === 'true' || status === 'CANCELLED';

      if (isCancelled) {
        this.router.navigate(['/payment/cancel']);
        return;
      }

      if (params['payment_id'] && !storedPaymentId) {
        const pid = parseInt(params['payment_id'], 10);
        this.paymentId.set(pid);
        this.confirmPayment(pid);
      } else if (storedPaymentId) {
        this.confirmPayment(parseInt(storedPaymentId, 10));
      } else {
        // No payment to confirm - just show static success with whatever we have.
        this.confirmTime.set(new Date());
      }
    });

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
      next: (response: any) => {
        this.isConfirming.set(false);
        this.confirmTime.set(new Date());

        const data = response?.data || {};

        if (data.amount) {
          this.amount.set(data.amount);
        }

        if (data.type) {
          this.paymentType.set(data.type);
        }

        if (data.order_id) {
          this.orderId.set(data.order_id);
        }

        if (data.wallet_balance !== undefined) {
          this.walletBalance.set(data.wallet_balance);
        }

        if (this.paymentType() === 'order') {
          this.statusMessage.set('Đơn hàng của bạn đang được xử lý.');
        } else if (this.paymentType() === 'upgrade') {
          this.statusMessage.set('Tài khoản của bạn đã được nâng cấp.');
        } else if (this.paymentType() === 'deposit') {
          this.statusMessage.set('Số dư ví của bạn đã được cập nhật.');
        } else {
          this.statusMessage.set('Giao dịch của bạn đã hoàn tất.');
        }

        sessionStorage.removeItem('paymentId');
        sessionStorage.removeItem('paymentAmount');
      },
      error: (err: any) => {
        this.isConfirming.set(false);
        console.error('Payment confirmation failed:', err);

        if (err.status === 401) {
          this.authSvc.logout();
          this.router.navigate(['/login']);
          return;
        }

        this.statusMessage.set('Đã ghi nhận giao dịch. Hệ thống có thể mất vài phút để cập nhật.');

        sessionStorage.removeItem('paymentId');
        sessionStorage.removeItem('paymentAmount');
      }
    });
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
