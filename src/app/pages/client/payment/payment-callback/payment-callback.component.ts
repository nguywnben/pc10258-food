import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PaymentService, PaymentResponse } from '../../../../services/payment.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mx-auto w-full max-w-2xl space-y-6 py-12">
      <section class="rounded-3xl border border-gray-100 bg-white p-6 sm:p-7 text-center">
        <div *ngIf="isProcessing()" class="space-y-4">
          <div class="flex justify-center">
            <svg class="h-12 w-12 animate-spin text-brand" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-ink">Đang xác nhận thanh toán...</h2>
          <p class="text-sm text-ink-light">Vui lòng đợi trong giây lát.</p>
        </div>

        <div *ngIf="!isProcessing() && isSuccess()" class="space-y-4">
          <div class="flex justify-center">
            <svg class="h-12 w-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-ink">Giao dịch thành công!</h2>
          <p class="text-sm text-ink-light">Thanh toán của bạn đã được ghi nhận. Hệ thống đang chuyển hướng...</p>
          <div class="mt-6">
            <a [routerLink]="['/wallet']" class="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-hover">
              Quay lại ví
            </a>
          </div>
        </div>

        <div *ngIf="!isProcessing() && !isSuccess()" class="space-y-4">
          <div class="flex justify-center">
            <svg class="h-12 w-12 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-ink">Thanh toán không thành công</h2>
          <p class="text-sm text-ink-light">{{ errorMessage() || 'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.' }}</p>
          <div class="mt-6 flex gap-3 justify-center">
            <a [routerLink]="['/orders']" class="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-hover">
              Đến danh sách đơn hàng
            </a>
            <a [routerLink]="['/']" class="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-ink hover:bg-gray-50">
              Về trang chủ
            </a>
          </div>
        </div>
      </section>
    </div>
  `
})
export class PaymentCallbackComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly paymentSvc = inject(PaymentService);
  private readonly authSvc = inject(AuthService);

  isProcessing = signal(true);
  isSuccess = signal(false);
  errorMessage = signal<string>('');
  paymentId: number | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      // PayOS passes orderCode which corresponds to the Payment ID
      this.paymentId = (params['payment_id'] ? parseInt(params['payment_id'], 10) : null) 
                     || (params['orderCode'] ? parseInt(params['orderCode'], 10) : null);
      
      const isCancelled = params['cancel'] === 'true';
      const status = params['status']; // PAID or CANCELLED from PayOS

      // ALWAYS submit to backend so backend updates payment status properly
      if (this.paymentId) {
        this.confirmPayment();
      } else {
        this.handleError('Không tìm thấy mã giao dịch.');
      }
    });
  }

  private confirmPayment(): void {
    if (!this.paymentId) {
      this.handleError('Không tìm thấy thông tin thanh toán.');
      return;
    }

    this.paymentSvc.confirmPayment(this.paymentId, {
      transaction_code: `PAYOS-${this.paymentId}`
    }).subscribe({
      next: (response: any) => {
        this.isProcessing.set(false);

        const status = response.data?.status;
        if (status === 'failed' || status === 'cancelled') {
          this.isSuccess.set(false);
          this.errorMessage.set(
            response.data?.order_cancelled
              ? 'Giao dịch bị hủy. Đơn hàng đã được tự động hủy.'
              : 'Giao dịch bị hủy.'
          );
        } else {
          this.isSuccess.set(true);
          // Redirect to wallet after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/wallet']);
          }, 3000);
        }
      },
      error: (err: any) => {
        // Handle 401 Unauthorized
        if (err.status === 401) {
          this.handleError('Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.');
          return;
        }
        this.handleError(err.error?.message || 'Lỗi xác nhận thanh toán');
      }
    });
  }

  private handleError(message: string): void {
    this.isProcessing.set(false);
    this.isSuccess.set(false);
    this.errorMessage.set(message);
  }

  retryPayment(): void {
    if (this.paymentId) {
      this.isProcessing.set(true);
      this.confirmPayment();
    }
  }
}
