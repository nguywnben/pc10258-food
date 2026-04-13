import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { CartService, CartItem } from '../../../services/cart.service';
import { WalletService, Wallet } from '../../../services/wallet.service';
import { AddressService, Address } from '../../../services/address.service';
import { PromotionService, Promotion } from '../../../services/promotion.service';
import { OrderService } from '../../../services/order.service';

@Component({
  selector: 'app-right-sidebar',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './right-sidebar.html',
  host: {
    class: 'h-full min-h-0 flex flex-col',
  },
})
export class RightSidebar implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly walletService = inject(WalletService);
  private readonly addressService = inject(AddressService);
  private readonly promoService = inject(PromotionService);
  private readonly orderService = inject(OrderService);

  private destroy$ = new Subject<void>();

  wallet: Wallet | null = null;
  defaultAddress: Address | null = null;
  
  cartItems: CartItem[] = [];
  subtotal: number = 0;
  cartCount: number = 0;

  promoCodeInput: string = '';
  appliedPromo: Promotion | null = null;
  discountAmount: number = 0;

  ngOnInit() {
    this.loadWallet();
    this.loadAddress();
    this.loadCart();

    // Lắng nghe sự kiện cập nhật giỏ hàng từ component khác
    this.cartService.cartUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadCart();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isFavoritesRoute(): boolean {
    const p = this.router.url.split(/[?#]/)[0];
    return p === '/favorites';
  }

  loadWallet() {
    // Để gọi API Wallet cần Token (Nên gắn cứng tạm hoặc bắt lỗi 401 bỏ qua)
    this.walletService.getWallet().subscribe({
      next: (res: any) => this.wallet = res.data,
      error: () => console.warn('Cần đăng nhập để tải ví')
    });
  }

  loadAddress() {
    this.addressService.getAddresses().subscribe({
      next: (res: any) => {
        if (res.data && res.data.length > 0) {
          this.defaultAddress = res.data.find((a: any) => a.is_default === 1) || res.data[0];
        }
      },
      error: () => console.warn('Cần đăng nhập để tải địa chỉ')
    });
  }

  loadCart() {
    this.cartService.getCart().subscribe({
      next: (res: any) => {
        this.cartItems = res.data.items || [];
        this.subtotal = res.data.subtotal || 0;
        this.cartCount = res.data.count || 0;
        this.recalculateDiscount();
      },
      error: () => console.warn('Cần đăng nhập để xem giỏ hàng')
    });
  }

  updateQuantity(id: number, currentQty: number, change: number) {
    const newQty = currentQty + change;
    this.cartService.updateQuantity(id, newQty).subscribe({
      next: () => this.loadCart(),
      error: (err: any) => alert(err.error?.message || 'Lỗi cập nhật')
    });
  }

  applyPromo() {
    if (!this.promoCodeInput.trim()) {
      this.appliedPromo = null;
      this.recalculateDiscount();
      return;
    }
    this.promoService.validatePromo(this.promoCodeInput, this.subtotal).subscribe({
      next: (res: any) => {
        this.appliedPromo = res.data;
        this.recalculateDiscount();
        alert('Áp dụng mã giảm giá thành công!');
      },
      error: (err: any) => {
        alert(err.error?.message || 'Mã giảm giá không hợp lệ');
        this.appliedPromo = null;
        this.recalculateDiscount();
      }
    });
  }

  recalculateDiscount() {
    if (!this.appliedPromo) {
      this.discountAmount = 0;
      return;
    }
    if (this.appliedPromo.discount_type === 'fixed') {
      this.discountAmount = this.appliedPromo.discount_value;
    } else {
      this.discountAmount = Math.floor(this.subtotal * (this.appliedPromo.discount_value / 100));
    }
    if (this.discountAmount > this.subtotal) {
      this.discountAmount = this.subtotal;
    }
  }

  get totalAmount(): number {
    return this.subtotal - this.discountAmount;
  }

  checkout() {
    if (this.cartItems.length === 0) {
      alert('Giỏ hàng đang trống!');
      return;
    }

    const payload = {
      address_id: this.defaultAddress?.id,
      payment_method: 'Thanh toán trực tuyến',
      promo_code: this.appliedPromo?.code
    };

    this.orderService.createOrder(payload).subscribe({
      next: (res: any) => {
        alert('Đặt hàng thành công!');
        this.loadCart();
        this.router.navigate(['/payment'], { 
          queryParams: { 
            type: 'order', 
            amount: res.data.order.total, 
            label: `Thanh toán hoá đơn ${res.data.order.order_code}` 
          } 
        });
      },
      error: (err: any) => alert(err.error?.message || 'Lỗi đặt hàng')
    });
  }
}