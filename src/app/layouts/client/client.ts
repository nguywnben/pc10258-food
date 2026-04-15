import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthSidebar } from '../../components/client/auth-sidebar/auth-sidebar';
import { Header } from '../../components/client/header/header';
import { LeftSidebar } from '../../components/client/left-sidebar/left-sidebar';
import { RightSidebar } from '../../components/client/right-sidebar/right-sidebar';
import { Footer } from '../../components/client/footer/footer';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [NgClass, Header, LeftSidebar, AuthSidebar, RightSidebar, Footer, RouterOutlet],
  templateUrl: './client.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        min-height: 0;
        overflow: hidden;
      }
    `,
  ],
})
export class ClientLayout {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  private currentPath(): string {
    const raw = this.router.url.split(/[?#]/)[0];
    return raw === '' ? '/' : raw;
  }

  /** Trang đăng nhập / đăng ký: khớp `login.html` — sidebar trái thu gọn, không footer trong main. */
  isAuthLayoutRoute(): boolean {
    const p = this.currentPath();
    return p === '/login' || p === '/register';
  }

  shouldUseAuthSidebar(): boolean {
    return this.isAuthLayoutRoute() || !this.authService.isAuthenticated();
  }

  /** Chỉ trang chủ và Yêu thích có sidebar phải (giỏ / gợi ý). */
  showRightSidebar(): boolean {
    const p = this.currentPath();
    if (this.shouldUseAuthSidebar()) return false;
    return p === '/' || p === '/favorites';
  }

  /** Padding `<main>` khớp các trang HTML tĩnh. */
  mainPaddingClass(): string {
    const p = this.currentPath();
    if (p === '/login' || p === '/register') return 'px-8 py-6';
    if (p === '/messages' || p === '/account') return 'p-0';
    if (
      p === '/orders' ||
      p === '/wallet' ||
      p === '/payment' ||
      p === '/upgrade' ||
      p === '/upgrade-success' ||
      p === '/help'
    )
      return 'px-6 py-6';
    return 'px-8 py-6';
  }
}