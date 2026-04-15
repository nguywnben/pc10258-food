import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { MenuService } from '../../../core/services/menu.service';
import { Category, Product, ProductQuery } from '../../../core/models/menu.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements AfterViewInit, OnInit, OnDestroy {
  private readonly menuService = inject(MenuService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private queryParamsSub?: Subscription;

  readonly categoriesLoading = signal(true);
  readonly productsLoading = signal(true);
  readonly favoritesLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);
  readonly favoriteProductIds = signal<number[]>([]);

  readonly selectedCategoryId = signal<number | null>(null);
  readonly selectedSort = signal<'popular' | 'price-asc' | 'price-desc' | 'new'>('popular');
  readonly selectedPriceRange = signal<string>('');

  private readonly allowedSorts = new Set<'popular' | 'price-asc' | 'price-desc' | 'new'>([
    'popular',
    'price-asc',
    'price-desc',
    'new',
  ]);

  ngOnInit(): void {
    this.loadCategories();
    this.listenFilterParams();
    this.loadFavorites();
  }

  ngOnDestroy(): void {
    this.queryParamsSub?.unsubscribe();
  }

  ngAfterViewInit(): void {
    // Load the provided static JS after Angular renders DOM,
    // so handlers (plus/minus, header time) can find elements.
    if (typeof document === 'undefined') return;
    if (document.querySelector('script#food-main-js')) return;

    const script = document.createElement('script');
    script.id = 'food-main-js';
    script.src = 'assets/js/main.js';
    document.body.appendChild(script);
  }

  onSelectCategory(categoryId: number | null): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        category_id: categoryId ?? null,
      },
      queryParamsHandling: 'merge',
    });
  }

  onSortChange(sort: 'popular' | 'price-asc' | 'price-desc' | 'new'): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: sort === 'popular' ? null : sort },
      queryParamsHandling: 'merge',
    });
  }

  onPriceRangeChange(value: string): void {
    const query: { min_price: number | null; max_price: number | null } = {
      min_price: null,
      max_price: null,
    };

    if (value === '0-50000') {
      query.max_price = 50000;
    } else if (value === '50000-100000') {
      query.min_price = 50000;
      query.max_price = 100000;
    } else if (value === '100000-200000') {
      query.min_price = 100000;
      query.max_price = 200000;
    } else if (value === '200000+') {
      query.min_price = 200000;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: query,
      queryParamsHandling: 'merge',
    });
  }

  toggleFavorite(product: Product): void {
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/login']);
      return;
    }

    const isFavorite = this.isFavorite(product.id);
    const request$ = isFavorite
      ? this.menuService.removeFavorite(product.id)
      : this.menuService.addFavorite(product.id);

    request$.subscribe({
      next: () => {
        if (isFavorite) {
          this.favoriteProductIds.set(this.favoriteProductIds().filter((id) => id !== product.id));
        } else {
          this.favoriteProductIds.set([...new Set([...this.favoriteProductIds(), product.id])]);
        }
      },
      error: (errorResponse: HttpErrorResponse) => {
        this.errorMessage.set(this.resolveErrorMessage(errorResponse, 'Không cập nhật được yêu thích.'));
      },
    });
  }

  isFavorite(productId: number): boolean {
    return this.favoriteProductIds().includes(productId);
  }

  formatPrice(price: number): string {
    return `${new Intl.NumberFormat('vi-VN').format(price)}₫`;
  }

  private listenFilterParams(): void {
    this.queryParamsSub = this.route.queryParamMap.subscribe((params) => {
      const categoryId = params.get('category_id');
      const rawSort = params.get('sort') as 'popular' | 'price-asc' | 'price-desc' | 'new' | null;
      const sort = rawSort && this.allowedSorts.has(rawSort) ? rawSort : 'popular';
      const minPrice = params.get('min_price');
      const maxPrice = params.get('max_price');

      this.selectedCategoryId.set(categoryId ? Number(categoryId) : null);
      this.selectedSort.set(sort);
      this.selectedPriceRange.set(this.resolvePriceRange(minPrice, maxPrice));

      const query: ProductQuery = {};

      if (categoryId) {
        query.category_id = Number(categoryId);
      }
      if (sort !== 'popular') {
        query.sort = sort;
      }
      if (minPrice) {
        const parsedMinPrice = Number(minPrice);
        if (Number.isFinite(parsedMinPrice)) {
          query.min_price = parsedMinPrice;
        }
      }
      if (maxPrice) {
        const parsedMaxPrice = Number(maxPrice);
        if (Number.isFinite(parsedMaxPrice)) {
          query.max_price = parsedMaxPrice;
        }
      }

      this.loadProducts(query);
    });
  }

  private loadCategories(): void {
    this.categoriesLoading.set(true);
    this.menuService
      .getCategories()
      .pipe(finalize(() => this.categoriesLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.categories.set(response.data ?? []);
        },
        error: (errorResponse: HttpErrorResponse) => {
          this.errorMessage.set(this.resolveErrorMessage(errorResponse, 'Không tải được danh mục món ăn.'));
        },
      });
  }

  private loadProducts(query: ProductQuery): void {
    this.productsLoading.set(true);
    this.errorMessage.set(null);

    this.menuService
      .getProducts(query)
      .pipe(finalize(() => this.productsLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.products.set(response.data ?? []);
        },
        error: (errorResponse: HttpErrorResponse) => {
          this.errorMessage.set(this.resolveErrorMessage(errorResponse, 'Không tải được danh sách sản phẩm.'));
          this.products.set([]);
        },
      });
  }

  private loadFavorites(): void {
    if (!this.authService.isAuthenticated()) {
      this.favoriteProductIds.set([]);
      return;
    }

    this.favoritesLoading.set(true);
    this.menuService
      .getFavorites()
      .pipe(finalize(() => this.favoritesLoading.set(false)))
      .subscribe({
        next: (response) => {
          const ids = (response.data ?? []).map((item) => item.product_id);
          this.favoriteProductIds.set(ids);
        },
        error: () => {
          this.favoriteProductIds.set([]);
        },
      });
  }

  private resolvePriceRange(minPrice: string | null, maxPrice: string | null): string {
    if (!minPrice && maxPrice === '50000') return '0-50000';
    if (minPrice === '50000' && maxPrice === '100000') return '50000-100000';
    if (minPrice === '100000' && maxPrice === '200000') return '100000-200000';
    if (minPrice === '200000' && !maxPrice) return '200000+';
    return '';
  }

  private resolveErrorMessage(errorResponse: HttpErrorResponse, fallbackMessage: string): string {
    const apiMessage = errorResponse.error?.message;
    if (typeof apiMessage === 'string') return apiMessage;

    const apiError = errorResponse.error?.error;
    if (typeof apiError === 'string' && apiError.trim()) return apiError;

    return fallbackMessage;
  }
}