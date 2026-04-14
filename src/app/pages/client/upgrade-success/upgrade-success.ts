import { AfterViewInit, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../services/payment.service';

@Component({
  selector: 'app-upgrade-success',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './upgrade-success.html',
})
export class UpgradeSuccess implements OnInit, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly paymentSvc = inject(PaymentService);

  isConfirming = signal(false);
  confirmMessage = signal<string>('');
  upgradeSuccess = signal(false);

  ngOnInit(): void {
    // Check for payment confirmation after PayOS return
    this.route.queryParams.subscribe(params => {
      const paymentId = params['payment_id'];
      const planId = sessionStorage.getItem('upgrade_plan_id');
      const paymentType = sessionStorage.getItem('upgrade_payment_type');

      console.log('📊 Upgrade Success Page:');
      console.log('  Payment ID:', paymentId);
      console.log('  Plan ID:', planId);
      console.log('  Payment Type:', paymentType);

      // If PayOS payment, confirm it now
      if (paymentId && planId && paymentType === 'payos') {
        console.log('🔄 Confirming PayOS payment...');
        this.confirmPaymentAndUpgrade(paymentId, planId);
      } else if (!paymentType || paymentType === 'wallet') {
        // For wallet payment, membership already upgraded
        console.log('✅ Wallet payment - membership already upgraded');
        this.upgradeSuccess.set(true);
        this.confirmMessage.set('');
        // Cleanup
        sessionStorage.removeItem('upgrade_plan_id');
        sessionStorage.removeItem('upgrade_payment_id');
        sessionStorage.removeItem('upgrade_payment_type');
      }
    });
  }

  /**
   * Confirm PayOS payment and upgrade membership
   */
  private confirmPaymentAndUpgrade(paymentId: string, planId: string): void {
    this.isConfirming.set(true);
    this.confirmMessage.set('Đang xác nhận thanh toán...');

    this.paymentSvc.confirmPayment(paymentId, {
      plan_id: parseInt(planId, 10)
    }).subscribe({
      next: (response) => {
        console.log('✅ Payment confirmed & membership upgraded:', response);
        this.isConfirming.set(false);
        this.upgradeSuccess.set(true);
        this.confirmMessage.set('');
        
        // Cleanup sessionStorage
        sessionStorage.removeItem('upgrade_plan_id');
        sessionStorage.removeItem('upgrade_payment_id');
        sessionStorage.removeItem('upgrade_payment_type');
      },
      error: (err: any) => {
        this.isConfirming.set(false);
        console.error('❌ Payment confirmation failed:', err);
        
        const errorMsg = err.error?.message || err.error?.error || 'Xác nhận thanh toán thất bại';
        this.confirmMessage.set(`❌ Lỗi: ${errorMsg}`);
      }
    });
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

