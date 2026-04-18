import { afterNextRender, Component, effect, inject, OnDestroy, signal, ChangeDetectorRef } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { asyncScheduler, BehaviorSubject, Subject } from 'rxjs';
import { filter, observeOn, takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { CartService, CartItem } from '../../../services/cart.service';
import { WalletService, Wallet } from '../../../services/wallet.service';
import { AddressService, Address } from '../../../services/address.service';
import { PromotionService, Promotion } from '../../../services/promotion.service';
import { OrderService } from '../../../services/order.service';
import { ToastService } from '../../toast/toast.service';

@Component({
  selector: 'app-right-sidebar',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './right-sidebar.html',
  host: {
    class: 'h-full min-h-0 flex flex-col',
  },
})
export class RightSidebar implements OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly walletService = inject(WalletService);
  private readonly addressService = inject(AddressService);
  private readonly promoService = inject(PromotionService);
  private readonly orderService = inject(OrderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toast = inject(ToastService);

  private destroy$ = new Subject<void>();

  private readonly walletSubject = new BehaviorSubject<Wallet | null>(null);
  readonly wallet$ = this.walletSubject.pipe(observeOn(asyncScheduler));

  defaultAddress: Address | null = null;
  
  cartItems: CartItem[] = [];
  subtotal: number = 0;
  cartCount: number = 0;

  promoCodeInput: string = '';
  appliedPromo: Promotion | null = null;
  discountAmount: number = 0;

  readonly isFavoritesRoute = signal(this.computeIsFavoritesRoute());

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.isFavoritesRoute.set(this.computeIsFavoritesRoute()));

    this.cartService.cartUpdated$
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.auth.isAuthenticated()),
      )
      .subscribe(() => this.loadCart());

    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.loadWallet();
        this.loadAddress();
        this.loadCart();
      } else {
        this.clearGuestSidebarState();
      }
    });

    afterNextRender(() => {
      this.scheduleViewUpdate(() => this.isFavoritesRoute.set(this.computeIsFavoritesRoute()));
    });
  }

  private clearGuestSidebarState(): void {
    this.walletSubject.next(null);
    this.defaultAddress = null;
    this.cartItems = [];
    this.subtotal = 0;
    this.cartCount = 0;
    this.appliedPromo = null;
    this.promoCodeInput = '';
    this.discountAmount = 0;
  }

  private computeIsFavoritesRoute(): boolean {
    const p = this.router.url.split(/[?#]/)[0];
    return p === '/favorites';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private scheduleViewUpdate(fn: () => void): void {
    setTimeout(fn, 0);
  }

  loadWallet() {
    this.walletService.getWallet().subscribe({
      next: (res: any) => this.walletSubject.next(res.data ?? null),
      error: () => {
        console.warn('Cần đăng nhập để tải ví');
        this.walletSubject.next(null);
      },
    });
  }

  loadAddress() {
    this.addressService.getAddresses().subscribe({
      next: (res: any) =>
        this.scheduleViewUpdate(() => {
          if (res.data && res.data.length > 0) {
            this.defaultAddress = res.data.find((a: any) => a.is_default === 1) || res.data[0];
          }
        }),
      error: () => console.warn('Cần đăng nhập để tải địa chỉ'),
    });
  }

  loadCart() {
    this.cartService.getCart().subscribe({
      next: (res: any) => {
        this.cartItems = res.data.items || [];
        this.subtotal = res.data.subtotal || 0;
        this.cartCount = res.data.count || 0;
        this.recalculateDiscount();
        this.cdr.detectChanges(); // Use detectChanges to force synchronous render instead of markForCheck
      },
      error: () => console.warn('Cần đăng nhập để xem giỏ hàng'),
    });
  }

  updateQuantity(id: number, currentQty: number, change: number) {
    const newQty = currentQty + change;
    this.cartService.updateQuantity(id, newQty).subscribe({
      next: () => this.loadCart(),
      error: (err: any) => this.toast.error(err.error?.message || 'Lỗi cập nhật')
    });
  }

  applyPromo() {
    if (!this.promoCodeInput.trim()) {
      this.appliedPromo = null;
      this.recalculateDiscount();
      this.cdr.markForCheck();
      return;
    }
    this.promoService.validatePromo(this.promoCodeInput, this.subtotal).subscribe({
      next: (res: any) => {
        this.appliedPromo = res.data;
        this.recalculateDiscount();
        this.cdr.markForCheck();
        this.toast.success('Áp dụng mã giảm giá thành công!');
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'Mã giảm giá không hợp lệ');
        this.appliedPromo = null;
        this.recalculateDiscount();
        this.cdr.markForCheck();
      }
    });
  }

  removePromo() {
    this.appliedPromo = null;
    this.promoCodeInput = '';
    this.recalculateDiscount();
    this.cdr.markForCheck();
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
      this.toast.warning('Giỏ hàng đang trống!');
      return;
    }

    const payload = {
      address_id: this.defaultAddress?.id,
      payment_method: 'Thanh toán trực tuyến',
      promo_code: this.appliedPromo?.code
    };

    this.orderService.createOrder(payload).subscribe({
      next: (res: any) => {
        this.loadCart();
        this.router.navigate(['/payment'], { 
          state: {
            type: 'order',
            amount: res.data.order.total,
            order_id: res.data.order.id
          },
          queryParams: { 
            type: 'order', 
            amount: res.data.order.total, 
            order_id: res.data.order.id,
            label: `Thanh toán hoá đơn ${res.data.order.order_code}` 
          } 
        });
      },
      error: (err: any) => this.toast.error(err.error?.message || 'Lỗi đặt hàng')
    });
  }
}