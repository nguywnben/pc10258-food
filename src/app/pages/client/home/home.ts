import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { MenuService } from '../../../core/services/menu.service';
import { SearchService } from '../../../core/services/search.service';
import { CartService } from '../../../services/cart.service';
import { Category, Product, ProductQuery } from '../../../core/models/menu.model';
import { ClientProductModalComponent } from '../../../components/client/product-modal/client-product-modal.component';
import { ToastService } from '../../../components/toast/toast.service';

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
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly searchService = inject(SearchService);
  private subscriptions = new Subscription();

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
  readonly searchTerm = signal<string>('');
  
  readonly isProductModalOpen = signal(false);
  readonly selectedProduct = signal<Product | null>(null);

  openProductModal(product: Product) {
    void this.router.navigate(['/product', product.id]);
  }

  // Obsolete - kept to prevent template errors before HTML update
  closeProductModal() {
    this.isProductModalOpen.set(false);
  }

  onAddToCart(product: Product) {
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/login']);
      return;
    }
    
    this.cartService.addToCart(product.id, 1).subscribe({
      next: () => {
        this.toast.success(`Đã thêm ${product.name} vào giỏ hàng thành công!`);
        this.closeProductModal();
      },
      error: (err: HttpErrorResponse) => {
        this.toast.error(err.error?.message || 'Có lỗi khi thêm giỏ hàng. Thử lại sau.');
      }
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts(this.buildProductQuery());
    this.loadFavorites();

    // Subscribe to search term changes
    const searchSub = this.searchService.searchTerm$.subscribe((term) => {
      this.searchTerm.set(term);
      this.loadProducts(this.buildProductQuery());
    });
    this.subscriptions.add(searchSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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
    this.selectedCategoryId.set(categoryId);
    this.loadProducts(this.buildProductQuery());
  }

  onSortChange(sort: 'popular' | 'price-asc' | 'price-desc' | 'new'): void {
    this.selectedSort.set(sort);
    this.loadProducts(this.buildProductQuery());
  }

  onPriceRangeChange(value: string): void {
    if (value === '0-50000') {
    } else if (value === '50000-100000') {
    } else if (value === '100000-200000') {
    } else if (value === '200000+') {
    }

    this.selectedPriceRange.set(value);
    this.loadProducts(this.buildProductQuery());
  }

  toggleFavorite(product: Product): void {
    const isFavorite = this.isFavorite(product.id);
    const request$ = isFavorite
      ? this.menuService.removeFavorite(product.id)
      : this.menuService.addFavorite(product.id);

    request$.subscribe({
      next: () => {
        if (isFavorite) {
          this.favoriteProductIds.set(this.favoriteProductIds().filter((id) => id !== product.id));
          this.toast.success(`Đã bỏ ${product.name} khỏi danh sách yêu thích.`);
        } else {
          this.favoriteProductIds.set([...new Set([...this.favoriteProductIds(), product.id])]);
          this.toast.success(`Đã thêm ${product.name} vào danh sách yêu thích.`);
        }
      },
      error: (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 401) {
          this.toast.warning('Vui lòng đăng nhập để thực hiện chức năng này.');
        } else {
          const message = this.resolveErrorMessage(errorResponse, 'Không cập nhật được yêu thích.');
          this.errorMessage.set(message);
          this.toast.error(message);
        }
      },
    });
  }

  isFavorite(productId: number): boolean {
    return this.favoriteProductIds().includes(productId);
  }

  formatPrice(price: number): string {
    return `${new Intl.NumberFormat('vi-VN').format(price)}₫`;
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

  private buildProductQuery(): ProductQuery {
    const query: ProductQuery = {};

    if (this.selectedCategoryId() !== null) {
      query.category_id = this.selectedCategoryId() as number;
    }

    if (this.selectedSort() !== 'popular') {
      query.sort = this.selectedSort();
    }

    const range = this.selectedPriceRange();
    if (range === '0-50000') {
      query.max_price = 50000;
    } else if (range === '50000-100000') {
      query.min_price = 50000;
      query.max_price = 100000;
    } else if (range === '100000-200000') {
      query.min_price = 100000;
      query.max_price = 200000;
    } else if (range === '200000+') {
      query.min_price = 200000;
    }

    const search = this.searchTerm().trim();
    if (search) {
      query.search = search;
    }

    return query;
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