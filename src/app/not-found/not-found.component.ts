import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-[70vh] flex items-center justify-center px-6 py-12">
      <div class="max-w-xl w-full bg-white border border-gray-100 rounded-[24px] shadow-soft p-10 text-center">
        <p class="text-6xl font-black text-brandOrange leading-none">404</p>
        <h1 class="mt-4 text-2xl font-bold text-primary">Không tìm thấy trang</h1>
        <p class="mt-2 text-sm text-gray-500">Trang bạn tìm không tồn tại.</p>

        <div class="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            (click)="goToCategories()"
            class="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-100 hover:bg-gray-50 transition"
          >
            Quay về danh mục
          </button>

          <button
            type="button"
            (click)="goToHome()"
            class="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 transition"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundComponent {
  constructor(private readonly router: Router) {}

  goToCategories(): void {
    void this.router.navigate(['/admin/categories/list']);
  }

  goToHome(): void {
    void this.router.navigate(['/']);
  }
}
