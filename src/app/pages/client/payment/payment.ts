import { AfterViewInit, Component, OnInit, signal, inject, computed } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MembershipService, MembershipPlan } from '../../../services/membership.service';
import { PaymentService } from '../../../services/payment.service';
import { WalletService } from '../../../services/wallet.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../services/order.service';
import { ToastService } from '../../../components/toast/toast.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './payment.html',
})
export class PaymentComponent implements OnInit, AfterViewInit {
  private readonly toast = inject(ToastService);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly membershipSvc = inject(MembershipService);
  private readonly paymentSvc = inject(PaymentService);
  private readonly walletSvc = inject(WalletService);
  private readonly authSvc = inject(AuthService);
  private readonly orderSvc = inject(OrderService);

  paymentType = signal<'wallet' | 'membership-upgrade' | 'order'>('wallet');
  membershipPlan = signal<MembershipPlan | null>(null);
  isProcessing = signal(false);
  agreeConfirm = signal(false);
  
  // Wallet payment data
  paymentAmount = signal<number>(0);
  paymentId = signal<number | null>(null);
  checkoutUrl = signal<string | null>(null);
  orderId = signal<number | null>(null);

  // Wallet balance & payment method
  walletBalance = signal<number>(0);
  selectedPaymentMethod = signal<'payos' | 'wallet'>('payos');
  isLoadingWallet = signal(false);
  walletLoadError = signal<string>('');

  isLoading = computed(() => this.isProcessing() && this.paymentAmount() === 0);

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    
    // Check authentication first
    if (!this.authSvc.isAuthenticated()) {
      console.error('❌ User not authenticated');
      this.toast.error('Vui lòng đăng nhập để tiếp tục');
      this.router.navigate(['/login']);
      return;
    }
    
    // Check sessionStorage first (more reliable than router state) - Browser only
    let loadedFromStorage = false;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const storedPlan = sessionStorage.getItem('upgrade_plan');
      const storedAmount = sessionStorage.getItem('upgrade_amount');
      
      if (storedPlan) {
        const plan = JSON.parse(storedPlan);
        this.membershipPlan.set(plan);
        this.paymentType.set('membership-upgrade');
        this.paymentAmount.set(parseInt(storedAmount || '0', 10));
        
        // Clean up sessionStorage
        sessionStorage.removeItem('upgrade_plan');
        sessionStorage.removeItem('upgrade_amount');
        loadedFromStorage = true;
      }
    }

    if (!loadedFromStorage && navigation?.extras.state) {
      const state = navigation?.extras.state;
      this.paymentType.set(state['type'] || 'wallet');
      
      if (state['plan']) {
        this.membershipPlan.set(state['plan']);
        // Auto-set amount from plan price if not already set
        if (!state['amount']) {
          this.paymentAmount.set(state['plan'].price);
        }
      }

      // Wallet payment data
      if (state['amount']) {
        this.paymentAmount.set(state['amount']);
      }
      
      if (state['payment_id']) {
        this.paymentId.set(state['payment_id']);
      }

      if (state['checkout_url']) {
        this.checkoutUrl.set(state['checkout_url']);
      }
      
      if (state['order_id']) {
        this.orderId.set(state['order_id']);
      }
    }

    // Load wallet balance
    this.loadWalletBalance();

    // Additional route params handling
    this.route.queryParams.subscribe(params => {
      if (params['type']) {
        this.paymentType.set(params['type'] as any);
      }
      if (params['order_id']) {
        this.orderId.set(parseInt(params['order_id'], 10));
      }
      if (params['amount'] && !this.paymentAmount()) {
        this.paymentAmount.set(parseInt(params['amount'], 10));
      }
    });
  }

  confirmPayment(): void {
    if (!this.agreeConfirm()) {
      this.toast.warning('Vui lòng xác nhận thông tin thanh toán');
      return;
    }

    // Check payment method for wallet-type payments
    if (this.paymentType() === 'wallet') {
      if (this.selectedPaymentMethod() === 'wallet') {
        this.processWalletBalancePayment();
      } else {
        this.processWalletPayment();
      }
    } else if (this.paymentType() === 'membership-upgrade') {
      // Check payment method for membership upgrade
      if (this.selectedPaymentMethod() === 'wallet') {
        this.processMembershipUpgradeWithWallet();
      } else {
        this.processMembershipPayment();
      }
    } else if (this.paymentType() === 'order') {
      if (this.selectedPaymentMethod() === 'wallet') {
        this.processWalletBalancePayment();
      } else {
        this.processOrderPayment();
      }
    }
  }

  /**
   * Load wallet balance
   */
  private loadWalletBalance(): void {
    this.isLoadingWallet.set(true);
    this.walletLoadError.set('');
    this.walletSvc.getWallet().subscribe({
      next: (response) => {
        this.walletBalance.set(response.data.balance);
        this.isLoadingWallet.set(false);
      },
      error: (err: any) => {
        console.error('❌ Failed to load wallet balance:', err);
        console.error('  Status:', err.status);
        console.error('  Message:', err.error?.message || err.message);
        
        // Handle 401 Unauthorized
        if (err.status === 401) {
          this.walletLoadError.set('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          this.authSvc.logout();
          this.router.navigate(['/login']);
          return;
        }
        
        // For other errors, keep balance at 0 but log warning
        const errorMsg = err.error?.message || 'Không thể tải số dư ví. Vui lòng thử lại.';
        this.walletLoadError.set(errorMsg);
        this.walletBalance.set(0);
        this.isLoadingWallet.set(false);
      }
    });
  }

  /**
   * Process wallet payment via PayOS
   */
  private processWalletPayment(): void {
    const amount = this.paymentAmount();

    if (!amount) {
      this.toast.error('Thông tin thanh toán không hợp lệ');
      return;
    }

    this.isProcessing.set(true);

    // If checkout URL is available, redirect to PayOS checkout
    if (this.checkoutUrl()) {
      setTimeout(() => {
        window.location.href = this.checkoutUrl()!;
      }, 500);
      return;
    }

    // Otherwise create new payment
    const cancelUrl = `${window.location.origin}/payment/cancel`;

    this.paymentSvc.createPayment({
      amount,
      type: 'deposit',
      description: `Nạp tiền vào ví - ${amount.toLocaleString('vi-VN')} VNĐ`,
      cancel_url: cancelUrl,
      return_url: `${window.location.origin}/payment/callback`
    }).subscribe({
      next: (response) => {
        if (response.data.checkout_url) {
          // Redirect to PayOS checkout
          window.location.href = response.data.checkout_url;
        } else {
          this.isProcessing.set(false);
          this.toast.error('Lỗi: Không nhận được đường link thanh toán');
        }
      },
      error: (err: any) => {
        this.isProcessing.set(false);
        console.error('Payment creation failed:', err);
        
        // Handle 401 Unauthorized
        if (err.status === 401) {
          this.authSvc.logout();
          this.router.navigate(['/login']);
          return;
        }
        
        this.toast.error('Lỗi tạo payment: ' + (err.error?.message || 'Vui lòng thử lại'));
      }
    });
  }

  /**
   * Process membership upgrade payment with PayOS
   */
  private processMembershipPayment(): void {
    if (!this.membershipPlan()) {
      console.error('❌ No membership plan!');
      this.toast.error('Thông tin gói nâng cấp không hợp lệ');
      return;
    }

    this.isProcessing.set(true);
    const planId = this.membershipPlan()!.id;
    const amount = this.membershipPlan()!.price;

    const returnUrl = `${window.location.origin}/upgrade-success`;
    const cancelUrl = `${window.location.origin}/upgrade`;

    this.paymentSvc.createPayment({
      amount,
      description: `Nâng cấp Membership - ${this.membershipPlan()!.name} (${amount.toLocaleString('vi-VN')} VNĐ/tháng)`,
      return_url: returnUrl,
      cancel_url: cancelUrl
    }).subscribe({
      next: (response) => {
        if (response.data.checkout_url) {
          // Store membership plan ID for later confirmation
          sessionStorage.setItem('upgrade_plan_id', planId.toString());
          sessionStorage.setItem('upgrade_payment_id', response.data.id.toString());
          sessionStorage.setItem('upgrade_payment_type', 'payos');
          // Redirect to PayOS checkout
          window.location.href = response.data.checkout_url;
        } else {
          this.isProcessing.set(false);
          this.toast.error('Lỗi: Không nhận được đường link thanh toán');
        }
      },
      error: (err: any) => {
        this.isProcessing.set(false);
        console.error('❌ Payment creation failed:', err);
        
        // Handle 401 Unauthorized
        if (err.status === 401) {
          this.authSvc.logout();
          this.router.navigate(['/login']);
          return;
        }
        
        this.toast.error('Lỗi tạo payment: ' + (err.error?.message || 'Vui lòng thử lại'));
      }
    });
  }

  /**
   * Process order payment via PayOS
   */
  private processOrderPayment(): void {
    const amount = this.paymentAmount();
    const orderId = this.orderId();

    if (!amount || !orderId) {
      this.toast.error('Thông tin đơn hàng không hợp lệ');
      return;
    }

    this.isProcessing.set(true);

    const returnUrl = `${window.location.origin}/payment/callback`;
    const cancelUrl = `${window.location.origin}/payment/callback`;

    this.paymentSvc.createPayment({
      amount,
      type: 'order',
      order_id: orderId,
      description: `Thanh toan don so ${orderId}`,
      return_url: returnUrl,
      cancel_url: cancelUrl
    }).subscribe({
      next: (response) => {
        if (response.data.checkout_url) {
          sessionStorage.setItem('order_payment_id', response.data.id.toString());
          // Redirect to PayOS checkout
          window.location.href = response.data.checkout_url;
        } else {
          this.isProcessing.set(false);
          this.toast.error('Lỗi: Không nhận được đường link thanh toán');
        }
      },
      error: (err: any) => {
        this.isProcessing.set(false);
        console.error('Payment creation failed:', err);
        
        if (err.status === 401) {
          this.authSvc.logout();
          this.router.navigate(['/login']);
          return;
        }
        
        this.toast.error('Lỗi tạo payment: ' + (err.error?.message || 'Vui lòng thử lại'));
      }
    });
  }

  /**
   * Process membership upgrade payment using wallet balance
   */
  private processMembershipUpgradeWithWallet(): void {
    const amount = this.paymentAmount();
    const planId = this.membershipPlan()?.id;

    if (!planId || !amount) {
      console.error('❌ Missing plan ID or amount!');
      this.toast.error('Thông tin gói không hợp lệ');
      return;
    }

    if (this.walletBalance() < amount) {
      this.toast.error(`Số dư không đủ. Hiện có: ${this.formatPrice(this.walletBalance())}, Cần: ${this.formatPrice(amount)}`);
      return;
    }

    this.isProcessing.set(true);

    this.paymentSvc.payWithWallet({
      amount,
      type: 'upgrade',
      description: `Nâng cấp Membership - ${this.membershipPlan()!.name} (${amount.toLocaleString('vi-VN')} VNĐ/tháng)`
    }).subscribe({
      next: (response) => {
        // Now upgrade the membership
        this.membershipSvc.upgrade(planId!).subscribe({
          next: (upgradeResponse) => {
            this.isProcessing.set(false);
            
            // Store upgrade info
            sessionStorage.setItem('upgrade_plan_id', planId.toString());
            sessionStorage.setItem('upgrade_payment_id', response.data.payment_id.toString());
            sessionStorage.setItem('upgrade_method', 'wallet');
            
            // Redirect to success page
            this.router.navigate(['/upgrade-success']);
          },
          error: (upgradeErr: any) => {
            this.isProcessing.set(false);
            console.error('❌ Membership upgrade API failed:', upgradeErr);
            this.toast.error('Lỗi nâng cấp gói: ' + (upgradeErr.error?.message || 'Vui lòng thử lại'));
          }
        });
      },
      error: (err: any) => {
        this.isProcessing.set(false);
        console.error('❌ Wallet payment failed:', err);

        // Handle 401 Unauthorized
        if (err.status === 401) {
          this.authSvc.logout();
          this.router.navigate(['/login']);
          return;
        }

        this.toast.error('Lỗi thanh toán: ' + (err.error?.message || 'Vui lòng thử lại'));
      }
    });
  }

  /**
   * Process payment using wallet balance
   */
  private processWalletBalancePayment(): void {
    const amount = this.paymentAmount();

    if (!amount) {
      console.error('❌ Amount is invalid:', amount);
      this.toast.error('Số tiền không hợp lệ');
      return;
    }

    if (this.walletBalance() < amount) {
      this.toast.error(`Số dư không đủ. Hiện có: ${this.formatPrice(this.walletBalance())}, Cần: ${this.formatPrice(amount)}`);
      return;
    }

    this.isProcessing.set(true);

    const isOrder = this.paymentType() === 'order';
    const payload: any = {
      amount,
      type: isOrder ? 'order' : 'payment',
      description: isOrder ? `Thanh toán hoá đơn ${this.orderId() || ''}` : `Thanh toán ${amount.toLocaleString('vi-VN')} VNĐ`
    };

    if (isOrder && this.orderId()) {
      payload.order_id = this.orderId();
    }

    this.paymentSvc.payWithWallet(payload).subscribe({
      next: (response) => {
        this.isProcessing.set(false);
        // Store payment info and redirect to success page
        sessionStorage.setItem('paymentId', response.data.payment_id.toString());
        sessionStorage.setItem('paymentAmount', amount.toString());
        this.router.navigate(['/payment/success'], {
          queryParams: {
            payment_id: response.data.payment_id,
            method: 'wallet'
          }
        });
      },
      error: (err: any) => {
        this.isProcessing.set(false);
        console.error('❌ Wallet payment failed:', err);

        // Handle 401 Unauthorized
        if (err.status === 401) {
          this.authSvc.logout();
          this.router.navigate(['/login']);
          return;
        }

        // Handle insufficient balance
        if (err.status === 400 && err.error?.error?.includes('không đủ')) {
          this.toast.error(err.error.error);
          return;
        }

        this.toast.error('Lỗi thanh toán: ' + (err.error?.error || 'Vui lòng thử lại'));
      }
    });
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