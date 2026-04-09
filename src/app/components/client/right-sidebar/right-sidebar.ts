import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-right-sidebar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './right-sidebar.html',
  host: {
    class: 'h-full min-h-0 flex flex-col',
  },
})
export class RightSidebar {
  private readonly router = inject(Router);

  /** Sidebar phải trang Yêu thích khác bản Tổng quan — khớp `favorites.html`. */
  isFavoritesRoute(): boolean {
    const p = this.router.url.split(/[?#]/)[0];
    return p === '/favorites';
  }
}