import { AfterViewInit, Component, OnInit, signal, inject, computed, ViewChild } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MembershipService, MembershipPlan } from '../../../services/membership.service';
import { PaymentService } from '../../../services/payment.service';
import { WalletService } from '../../../services/wallet.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastComponent } from '../../../components/toast/toast.component';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ToastComponent],
  templateUrl: './payment.html',
})
export class PaymentComponent implements OnInit, AfterViewInit {
  @ViewChild(ToastComponent) toast!: ToastComponent;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly membershipSvc = inject(MembershipService);
  private readonly paymentSvc = inject(PaymentService);
  private readonly walletSvc = inject(WalletService);
  private readonly authSvc = inject(AuthService);

  paymentType = signal<'wallet' | 'membership-upgrade'>('wallet');
  membershipPlan = signal<MembershipPlan | null>(null);
  isProcessing = signal(false);
  agreeConfirm = signal(false);
  
  // Wallet payment data
  paymentAmount = signal<number>(0);
  paymentId = signal<number | null>(null);
  checkoutUrl = signal<string | null>(null);

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
      this.toast.displayToast('Vui lòng đăng nhập để tiếp tục', 'error');
      this.router.navigate(['/login']);
      return;
    }
    
    // Check sessionStorage first (more reliable than router state)
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
      // Continue to load wallet balance below
    } else if (navigation?.extras.state) {
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
    }

    // Load wallet balance
    this.loadWalletBalance();

    // Additional route params handling
    this.route.queryParams.subscribe(params => {
      if (params['amount'] && !this.paymentAmount()) {
        this.paymentAmount.set(parseInt(params['amount'], 10));
      }
    });
  }

  confirmPayment(): void {
    if (!this.agreeConfirm()) {
      this.toast.displayToast('Vui lòng xác nhận thông tin thanh toán', 'error');
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
    const paymentId = this.paymentId();

    if (!amount || !paymentId) {
      this.toast.displayToast('Thông tin thanh toán không hợp lệ', 'error');
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
    const returnUrl = `${window.location.origin}/payment/callback?payment_id=${paymentId}`;
    const cancelUrl = `${window.location.origin}/wallet#nap-tien`;

    this.paymentSvc.createPayment({
      amount,
      description: `Nạp tiền vào ví - ${amount.toLocaleString('vi-VN')} VNĐ`,
      return_url: returnUrl,
      cancel_url: cancelUrl
    }).subscribe({
      next: (response) => {
        if (response.data.checkout_url) {
          // Redirect to PayOS checkout
          window.location.href = response.data.checkout_url;
        } else {
          this.isProcessing.set(false);
          this.toast.displayToast('Lỗi: Không nhận được đường link thanh toán', 'error');
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
        
        this.toast.displayToast('Lỗi tạo payment: ' + (err.error?.message || 'Vui lòng thử lại'), 'error');
      }
    });
  }

  /**
   * Process membership upgrade payment with PayOS
   */
  private processMembershipPayment(): void {
    if (!this.membershipPlan()) {
      console.error('❌ No membership plan!');
      this.toast.displayToast('Thông tin gói nâng cấp không hợp lệ', 'error');
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
          this.toast.displayToast('Lỗi: Không nhận được đường link thanh toán', 'error');
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
        
        this.toast.displayToast('Lỗi tạo payment: ' + (err.error?.message || 'Vui lòng thử lại'), 'error');
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
      this.toast.displayToast('Thông tin gói không hợp lệ', 'error');
      return;
    }

    if (this.walletBalance() < amount) {
      this.toast.displayToast(`Số dư không đủ. Hiện có: ${this.formatPrice(this.walletBalance())}, Cần: ${this.formatPrice(amount)}`, 'error');
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
            this.toast.displayToast('Lỗi nâng cấp gói: ' + (upgradeErr.error?.message || 'Vui lòng thử lại'), 'error');
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

        this.toast.displayToast('Lỗi thanh toán: ' + (err.error?.message || 'Vui lòng thử lại'), 'error');
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
      this.toast.displayToast('Số tiền không hợp lệ', 'error');
      return;
    }

    if (this.walletBalance() < amount) {
      this.toast.displayToast(`Số dư không đủ. Hiện có: ${this.formatPrice(this.walletBalance())}, Cần: ${this.formatPrice(amount)}`, 'error');
      return;
    }

    this.isProcessing.set(true);

    this.paymentSvc.payWithWallet({
      amount,
      type: 'order',
      description: `Nạp tiền vào ví - ${amount.toLocaleString('vi-VN')} VNĐ`
    }).subscribe({
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
          this.toast.displayToast(err.error.error, 'error');
          return;
        }

        this.toast.displayToast('Lỗi thanh toán: ' + (err.error?.error || 'Vui lòng thử lại'), 'error');
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