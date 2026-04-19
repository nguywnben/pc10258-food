import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SearchService } from '../../../core/services/search.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgClass, RouterLink],
  templateUrl: './header.html',
})
export class Header {
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);

  private path(): string {
    return this.router.url.split(/[?#]/)[0];
  }

  /** Khớp header trong `favorites.html`. */
  isFavoritesRoute(): boolean {
    return this.path() === '/favorites';
  }

  /** Khớp header trong `messages.html`. */
  isMessagesRoute(): boolean {
    return this.path() === '/messages';
  }

  /** Khớp header trong `orders.html`. */
  isOrdersRoute(): boolean {
    return this.path() === '/orders';
  }

  /** Khớp header trong `account.html` (không có ô tìm kiếm). */
  isAccountRoute(): boolean {
    return this.path() === '/account';
  }

  /** Khớp header trong `wallet.html` (không có ô tìm kiếm). */
  isWalletRoute(): boolean {
    return this.path() === '/wallet';
  }

  /** Khớp header trong `payment.html` (không có ô tìm kiếm). */
  isPaymentRoute(): boolean {
    return this.path() === '/payment';
  }

  /** Khớp header trong `upgrade.html` (không có ô tìm kiếm). */
  isUpgradeRoute(): boolean {
    return this.path() === '/upgrade';
  }

  /** Khớp header trong `upgrade-success.html` (không có ô tìm kiếm). */
  isUpgradeSuccessRoute(): boolean {
    return this.path() === '/upgrade-success';
  }

  /** Khớp header trong `help.html` (không có ô tìm kiếm). */
  isHelpRoute(): boolean {
    return this.path() === '/help';
  }

  /** Khớp `login.html` — không ô tìm kiếm, cụm phải `ml-auto`. */
  isLoginRoute(): boolean {
    return this.path() === '/login';
  }

  /** Khớp `register.html`. */
  isRegisterRoute(): boolean {
    return this.path() === '/register';
  }

  searchPlaceholder(): string {
    if (this.isFavoritesRoute()) return 'Tìm trong món yêu thích...';
    return 'Tìm món...';
  }

  /** Khoảng cách giữa các cụm header (orders.html dùng gap-3, lg:gap-4). */
  headerGapClass(): string {
    return this.isOrdersRoute() ? 'gap-3 lg:gap-4' : 'gap-4';
  }

  /** Ẩn ô tìm kiếm (login/register/account/...). */
  showSearch(): boolean {
    return (
      !this.isAccountRoute() &&
      !this.isWalletRoute() &&
      !this.isPaymentRoute() &&
      !this.isUpgradeRoute() &&
      !this.isUpgradeSuccessRoute() &&
      !this.isHelpRoute() &&
      !this.isLoginRoute() &&
      !this.isRegisterRoute()
    );
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchService.setSearchTerm(input.value);
  }
}