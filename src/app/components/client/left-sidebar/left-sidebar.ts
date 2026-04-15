import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-left-sidebar',
  standalone: true,
  imports: [RouterLink, NgClass],
  templateUrl: './left-sidebar.html',
  host: {
    class: 'h-full min-h-0 flex flex-col',
  },
})
export class LeftSidebar {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  /** `<details>` "Khác" đang mở (dùng cho nền cam nhạt khi xổ, chưa chọn trang con). */
  otherExpanded = false;

  onOtherToggle(ev: Event): void {
    // Dùng currentTarget: khi click summary, `target` có thể là phần tử con → `open` sai → nhấp nhanh bị lệch highlight.
    const el = ev.currentTarget as HTMLDetailsElement;
    this.otherExpanded = el.open;
  }

  /** Nền cam nhạt cho dòng "Khác": đang ở Hồ sơ/Ví (hoặc luồng ví) hoặc đang xổ menu. */
  otherSummaryHighlight(): boolean {
    return this.otherSectionActive() || this.otherExpanded;
  }

  /** Mở `<details>` khi đang ở Hồ sơ/Ví (reload vẫn xổ), hoặc khi người dùng đã mở tay ở trang khác. */
  detailsOpen(): boolean {
    return this.otherSectionActive() || this.otherExpanded;
  }

  /** Đường dẫn hiện tại (không query / fragment). */
  path(): string {
    const raw = this.router.url.split(/[?#]/)[0];
    return raw === '' ? '/' : raw;
  }

  exact(p: string): boolean {
    return this.path() === p;
  }

  /** Ví + thanh toán / nạp tiền (luồng liên quan ví). */
  walletRelated(): boolean {
    const p = this.path();
    return p === '/wallet' || p === '/payment';
  }

  upgradeRelated(): boolean {
    const p = this.path();
    return p === '/upgrade' || p === '/upgrade-success';
  }

  otherSectionActive(): boolean {
    return this.exact('/account') || this.walletRelated();
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/']);
  }
}