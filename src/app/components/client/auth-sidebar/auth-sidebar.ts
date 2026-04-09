import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

/** Sidebar thu gọn như `login.html` / `register.html` (Tổng quan, Đăng nhập, Đăng ký). */
@Component({
  selector: 'app-auth-sidebar',
  standalone: true,
  imports: [RouterLink, NgClass],
  templateUrl: './auth-sidebar.html',
  host: {
    class: 'h-full min-h-0 flex flex-col',
  },
})
export class AuthSidebar {
  private readonly router = inject(Router);

  path(): string {
    const raw = this.router.url.split(/[?#]/)[0];
    return raw === '' ? '/' : raw;
  }

  exact(p: string): boolean {
    return this.path() === p;
  }
}
