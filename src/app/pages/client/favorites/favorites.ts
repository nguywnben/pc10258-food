import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { FavoriteRecord } from '../../../core/models/menu.model';
import { MenuService } from '../../../core/services/menu.service';
import { ToastService } from '../../../components/toast/toast.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './favorites.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Favorites implements AfterViewInit, OnInit {
  private readonly menuService = inject(MenuService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly favorites = signal<FavoriteRecord[]>([]);

  ngOnInit(): void {
    this.loadFavorites();
  }

  ngAfterViewInit(): void {
    // Load the provided static JS after Angular renders DOM,
    // so handlers can find elements (e.g. favorite heart).
    if (typeof document === 'undefined') return;
    if (document.querySelector('script#food-main-js')) return;

    const script = document.createElement('script');
    script.id = 'food-main-js';
    script.src = 'assets/js/main.js';
    document.body.appendChild(script);
  }

  removeFavorite(item: FavoriteRecord): void {
    this.menuService.removeFavorite(item.product_id).subscribe({
      next: () => {
        this.favorites.set(this.favorites().filter((favorite) => favorite.product_id !== item.product_id));
        this.toast.success(`Đã bỏ ${item.product?.name ?? 'món'} khỏi danh sách yêu thích.`);
      },
      error: (errorResponse: HttpErrorResponse) => {
        const message = this.resolveErrorMessage(errorResponse, 'Không bỏ được món yêu thích.');
        this.errorMessage.set(message);
        this.toast.error(message);
      },
    });
  }

  formatPrice(price: number): string {
    return `${new Intl.NumberFormat('vi-VN').format(price)}₫`;
  }

  private loadFavorites(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.menuService
      .getFavorites()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.favorites.set(response.data ?? []);
        },
        error: (errorResponse: HttpErrorResponse) => {
          this.errorMessage.set(this.resolveErrorMessage(errorResponse, 'Không tải được danh sách yêu thích.'));
          this.favorites.set([]);
        },
      });
  }

  private resolveErrorMessage(errorResponse: HttpErrorResponse, fallbackMessage: string): string {
    const apiMessage = errorResponse.error?.message;
    if (typeof apiMessage === 'string') return apiMessage;

    const apiError = errorResponse.error?.error;
    if (typeof apiError === 'string' && apiError.trim()) return apiError;

    return fallbackMessage;
  }
}

