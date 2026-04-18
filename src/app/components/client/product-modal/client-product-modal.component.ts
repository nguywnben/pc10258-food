import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Product } from '../../../core/models/menu.model';

@Component({
  selector: 'app-client-product-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (isOpen() && product()) {
      <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh]">
          
          <!-- Nút Đóng Mobile / Desktop Right-->
          <button
            type="button"
            class="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 p-1.5 text-gray-500 backdrop-blur transition hover:bg-red-50 hover:text-red-500 shadow-sm md:bg-gray-100"
            (click)="close.emit()"
          >
            <svg class="h-full w-full" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Ảnh sản phẩm -->
          <div class="relative w-full md:w-1/2 h-64 md:h-auto bg-gray-100">
            <img [src]="product()!.image_url || 'assets/images/placeholder.png'" [alt]="product()!.name" class="h-full w-full object-cover" />
            <!-- Tag trên ảnh -->
            <div class="absolute left-4 top-4 flex flex-col gap-2">
              <span class="rounded-xl bg-white/90 px-3 py-1 text-xs font-bold text-ink shadow-sm backdrop-blur">
                ⭐ {{ product()!.rating }} ({{ product()!.review_count }}+)
              </span>
            </div>
          </div>

          <!-- Nội dung -->
          <div class="flex w-full md:w-1/2 flex-col p-6 overflow-y-auto">
            <div class="flex-1">
              <div class="flex items-start justify-between gap-4">
                <h2 class="text-2xl font-bold leading-tight text-ink">{{ product()!.name }}</h2>
              </div>
              
              <div class="mt-4 flex flex-wrap items-center gap-3">
                <span class="text-2xl font-extrabold text-brand">{{ formatPrice(product()!.price) }}</span>
                <span class="rounded-lg bg-green-50 px-2 py-1 text-[11px] font-bold text-green-600 uppercase tracking-wide border border-green-100">Đang phục vụ</span>
              </div>

              <p class="mt-5 text-sm leading-relaxed text-ink-light">{{ product()!.description || 'Đang chờ cập nhật công thức từ đầu bếp hệ thống...' }}</p>

              <div class="mt-6 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 border-dashed relative">
                <!-- Info labels -->
                <div class="flex items-center gap-3 text-sm text-ink-light">
                  <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div class="flex-1 font-medium">Thời gian chuẩn bị: <span class="text-ink font-bold">{{ product()!.delivery_time || '10-15 phút' }}</span></div>
                </div>

                <div class="flex items-center gap-3 text-sm text-ink-light">
                   <div class="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                  </div>
                  <div class="flex-1 font-medium">Vận chuyển: <span class="text-ink font-bold">{{ product()!.delivery_info || 'Giao tốc độ siêu tốc' }}</span></div>
                </div>
              </div>
            </div>

            <!-- Nút hành động Modal dưới cùng -->
            <div class="mt-6 flex gap-3 pt-4 border-t border-gray-100 shrink-0">
              <button 
                (click)="toggleFavorite.emit(product()!)"
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 focus:outline-none"
                [class.!border-red-200]="isFav()"
                [class.!bg-red-50]="isFav()"
                [class.!text-red-500]="isFav()"
                title="Yêu thích món này"
              >
                @if (isFav()) {
                  <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                  </svg>
                } @else {
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                }
              </button>
              
              <button 
                class="btn btn-brand flex-1 !h-12 !text-sm !font-bold flex items-center justify-center gap-2"
                (click)="addToCart.emit(product()!)"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                Thêm vào Giỏ Hệ thống
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class ClientProductModalComponent {
  readonly isOpen = input(false);
  readonly product = input<Product | null>(null);
  readonly isFav = input(false);

  readonly close = output<void>();
  readonly toggleFavorite = output<Product>();
  readonly addToCart = output<Product>();

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  }
}
