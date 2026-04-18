import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuService } from '../../../core/services/menu.service';
import { CartService } from '../../../services/cart.service';
import { Product } from '../../../core/models/menu.model';
import { ToastService } from '../../../components/toast/toast.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
        <main class="flex-1 overflow-y-auto bg-white px-4 py-6 sm:px-8">
          <div class="mx-auto max-w-4xl">
            <!-- Navigation / Breadcrumb -->
            <nav class="mb-6 flex items-center justify-between">
              <button (click)="goBack()" class="group flex items-center text-sm font-semibold text-ink-light transition hover:text-brand">
                <div class="mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-50 transition group-hover:bg-brand/10">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </div>
                Quay lại thực đơn
              </button>
            </nav>

            @if (isLoading()) {
              <div class="flex h-48 items-center justify-center">
                <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand"></div>
              </div>
            } @else if (product()) {
              <div class="grid grid-cols-1 gap-10 lg:grid-cols-[5fr_7fr] items-start">
                
                <!-- Left: Focused Product Hero & Logistics -->
                <div class="flex flex-col gap-4">
                  <div class="relative group">
                    <div class="absolute -inset-3 rounded-3xl bg-gray-50/80 -z-10 opacity-0 transition duration-500 lg:opacity-100"></div>
                    
                    <div class="relative aspect-square w-full overflow-hidden rounded-3xl border border-gray-100 bg-white">
                      <img [src]="product()!.image_url || 'assets/images/placeholder.png'" 
                          [alt]="product()!.name" 
                          class="h-full w-full object-cover object-center transition duration-700 group-hover:scale-105" />
                    </div>
                  </div>

                  <!-- Delivery & Prep Time (Moved under image, side-by-side, compact) -->
                  <div class="grid grid-cols-2 gap-3">
                    <div class="flex items-center gap-3 rounded-2xl bg-gray-50/50 border border-gray-100 p-3 transition hover:bg-gray-100/50">
                      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                      <div class="overflow-hidden">
                        <div class="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-light">Chuẩn bị món</div>
                        <div class="truncate text-[13px] font-black text-ink">{{ product()!.delivery_time || '10-15 phút' }}</div>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-3 rounded-2xl bg-gray-50/50 border border-gray-100 p-3 transition hover:bg-gray-100/50">
                      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-brand">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      </div>
                      <div class="overflow-hidden">
                        <div class="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-light">Vận chuyển</div>
                        <div class="truncate text-[13px] font-black text-ink">{{ product()!.delivery_info || 'Giao tốc độ' }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Right: Product Information & Actions -->
                <div class="flex flex-col py-1 lg:py-2">
                  <!-- Badges -->
                  <div class="mb-3 flex flex-wrap items-center gap-2">
                    <span class="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                      {{ product()!.category?.name || 'Món ăn' }}
                    </span>
                    @if (product()!.is_available) {
                      <span class="inline-flex rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700 border border-green-100">
                        • Đang phục vụ
                      </span>
                    } @else {
                      <span class="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600 border border-red-100">
                        • Ngừng bán tạm thời
                      </span>
                    }
                  </div>

                  <!-- Title -->
                  <h1 class="mb-2 text-2xl font-black leading-tight text-ink sm:text-3xl lg:text-4xl">
                    {{ product()!.name }}
                  </h1>

                  <!-- Rating & Reviews -->
                  <div class="mb-5 flex items-center gap-3 text-sm font-medium">
                    <div class="flex items-center gap-1.5 text-orange-400">
                      <svg class="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span class="text-sm font-bold text-ink">{{ product()!.rating }}</span>
                    </div>
                    <div class="h-3 w-px bg-gray-200"></div>
                    <p class="text-[13px] text-ink-light"><span class="text-ink font-bold">{{ product()!.review_count }}+</span> lượt đánh giá</p>
                  </div>
                  
                  <!-- Price -->
                  <div class="mb-6">
                    <span class="text-[2rem] font-black tracking-tight text-brand">{{ formatPrice(product()!.price) }}</span>
                  </div>

                  <hr class="mb-6 border-gray-100" />

                  <!-- Description -->
                  <div class="mb-8">
                    <h3 class="mb-2 text-[13px] font-bold uppercase tracking-wider text-ink">Mô tả hương vị</h3>
                    <p class="text-[13px] leading-relaxed text-ink-light">
                      {{ product()!.description || 'Đang cập nhật mô tả chi tiết cho món ăn này từ các chuyên gia ẩm thực.' }}
                    </p>
                  </div>

                  <!-- Actions -->
                  <div class="mt-auto flex gap-3">
                    <button 
                      (click)="toggleFavorite()"
                      class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition-all focus:outline-none"
                      [class.!border-red-200]="isFav()"
                      [class.!bg-red-50]="isFav()"
                      [class.!text-red-500]="isFav()"
                      [ngClass]="!isFav() ? 'hover:bg-gray-50' : ''"
                      title="Yêu thích món này"
                    >
                      @if (isFav()) {
                        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                        </svg>
                      } @else {
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      }
                    </button>
                    
                    <button 
                      class="flex-1 h-12 rounded-xl bg-brand px-5 text-[13px] font-bold text-white transition-all hover:bg-brand-hover flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-gray-300 disabled:pointer-events-none"
                      (click)="addToCart()"
                      [disabled]="!product()!.is_available"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                      <span>{{ product()!.is_available ? 'Thêm vào Giỏ Hàng' : 'Tạm hết món' }}</span>
                    </button>
                  </div>
                </div>
              </div>
            } @else {
              <div class="flex flex-col items-center justify-center py-20 text-center">
                <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                  <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5 5 0 010 7.072M5 8h4l5-5v18l-5-5H5a2 2 0 01-2-2v-4a2 2 0 012-2z" /></svg>
                </div>
                <h2 class="mb-2 text-lg font-bold text-ink">Không tìm thấy món ăn</h2>
                <p class="mb-5 max-w-xs text-[13px] text-ink-light">Rất tiếc, món ăn bạn tìm kiếm có thể đã bị gỡ khỏi thực đơn hoặc đường dẫn không hợp lệ.</p>
                <button (click)="goBack()" class="rounded-xl bg-brand px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-brand-hover">Quay về trang chủ</button>
              </div>
            }
          </div>
        </main>
  `
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly menuSvc = inject(MenuService);
  private readonly cartSvc = inject(CartService);
  private readonly toast = inject(ToastService);

  readonly product = signal<Product | null>(null);
  readonly isLoading = signal(true);
  readonly isFav = signal(false);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadProduct(parseInt(idParam, 10));
    } else {
      this.isLoading.set(false);
    }
    this.checkIfFavorite();
  }

  loadProduct(id: number): void {
    this.menuSvc.getProductById(id).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.product.set(res.data);
          this.checkIfFavorite();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading product', err);
        this.isLoading.set(false);
      }
    });
  }

  checkIfFavorite(): void {
    const prod = this.product();
    if (!prod) return;
    this.menuSvc.getFavorites().subscribe({
      next: (res: any) => {
        if (res.data) {
          const isF = res.data.some((f: any) => f.product.id === prod.id);
          this.isFav.set(isF);
        }
      },
      error: () => {
        // Ignored for unauthenticated users
        this.isFav.set(false);
      }
    });
  }

  toggleFavorite(): void {
    const prod = this.product();
    if (!prod) return;
    
    if (this.isFav()) {
      this.menuSvc.removeFavorite(prod.id).subscribe({
        next: () => {
          this.isFav.set(false);
          this.toast.success(`Đã bỏ ${prod.name} khỏi danh sách yêu thích.`);
        },
        error: (err) => {
          if (err.status === 401) {
            this.toast.warning('Vui lòng đăng nhập để thực hiện chức năng này.');
          } else {
            this.toast.error(err.error?.message || 'Không cập nhật được yêu thích.');
          }
        }
      });
    } else {
      this.menuSvc.addFavorite(prod.id).subscribe({
        next: () => {
          this.isFav.set(true);
          this.toast.success(`Đã thêm ${prod.name} vào danh sách yêu thích.`);
        },
        error: (err) => {
          if (err.status === 401) {
            this.toast.warning('Vui lòng đăng nhập để thực hiện chức năng này.');
          } else {
            this.toast.error(err.error?.message || 'Không cập nhật được yêu thích.');
          }
        }
      });
    }
  }

  addToCart(): void {
    const prod = this.product();
    if (prod) {
      this.cartSvc.addToCart(prod.id, 1).subscribe({
        next: () => {
          this.toast.success(`Đã thêm ${prod.name} vào giỏ hàng thành công!`);
        },
        error: (err: any) => {
          if (err.status === 401) {
            this.toast.warning('Vui lòng đăng nhập để thêm giỏ hàng.');
          } else {
            this.toast.error(err.error?.message || 'Có lỗi khi thêm giỏ hàng. Thử lại sau.');
          }
        }
      });
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  }

  goBack(): void {
    window.history.back();
  }
}
