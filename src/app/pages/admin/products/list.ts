import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { DeleteModalComponent } from '../../../components/delete-modal/delete-modal.component';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { ProductModalComponent, ProductModalSaveEvent } from '../../../components/product-modal/product-modal.component';
import { ProductsService, Product, CreateProductPayload, UpdateProductPayload } from '../../../services/products.service';
import { ToastService } from '../../../components/toast/toast.service';
import { CategoriesService, Category } from '../../../services/categories.service';

@Component({
  selector: 'app-admin-products-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, DeleteModalComponent, PaginationComponent, ProductModalComponent],
  template: `
<section class="card-admin overflow-hidden">
  <div class="flex items-center justify-between gap-4 px-5 py-4">
    <div>
      <h2 class="text-sm font-bold text-ink">Kho sản phẩm</h2>
      <p class="text-xs text-ink-light">Tổng cộng {{ totalProducts() }} sản phẩm.</p>
    </div>
    <div class="flex items-center gap-3">
      <div class="relative hidden sm:block">
        <input
          type="text"
          placeholder="Tìm sản phẩm..."
          class="form-input !py-1.5 !pl-9 !text-xs w-64"
          (input)="onSearch($event)"
        />
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-lighter" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <button class="btn btn-brand !py-1.5 !text-xs shrink-0" type="button" (click)="openCreateModal()">
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M12 4v16m8-8H4" />
        </svg>
        Thêm sản phẩm
      </button>
    </div>
  </div>

  <div class="overflow-x-auto">
    @if (loading()) {
      <div class="px-5 py-10 text-center text-sm text-ink-light">Đang tải sản phẩm...</div>
    } @else if (error()) {
      <div class="px-5 py-10 text-center text-sm text-red-500">{{ error() }}</div>
    } @else if (products().length === 0) {
      <div class="px-5 py-10 text-center text-sm text-ink-light">Chưa có sản phẩm nào.</div>
    } @else {
      <table class="admin-table">
        <thead>
          <tr>
            <th>Mã</th>
            <th>Sản phẩm</th>
            <th>Danh mục</th>
            <th>Giá bán</th>
            <th>Đánh giá</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          @for (product of paginatedProducts(); track trackByProductId($index, product)) {
            <tr>
              <td class="font-semibold text-brand">#{{ product.id }}</td>
              <td>
                <div class="flex items-center gap-3">
                  <img
                    [src]="product.image_url || 'assets/images/placeholder.png'"
                    [alt]="product.name"
                    class="h-10 w-10 rounded-lg object-cover"
                  />
                  <div>
                    <p class="font-semibold text-ink">{{ product.name }}</p>
                    <div class="text-[10px] text-ink-lighter max-w-[150px] truncate" [title]="product.name" [innerHTML]="product.description || 'Chưa có mô tả'">
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge badge-neutral text-[10px]">{{ getCategoryName(product.category_id) }}</span>
              </td>
              <td class="font-semibold text-ink">{{ product.price | number:'1.0-0' }}₫</td>
              <td>
                <div class="flex flex-col">
                  <div class="flex items-center gap-1 text-amber-500">
                    <svg class="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                    <span class="text-xs font-bold">{{ product.rating }}</span>
                  </div>
                  <span class="text-[10px] text-ink-lighter">{{ product.review_count }} đánh giá</span>
                </div>
              </td>
              <td>
                @if (product.is_available === 1) {
                  <span class="badge badge-success text-[10px]">Đang bán</span>
                } @else {
                  <span class="badge badge-neutral text-[10px]">Ngừng</span>
                }
              </td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-ghost !p-1.5" title="Sửa" type="button" (click)="openEditModal(product)">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    class="btn btn-ghost !p-1.5 text-red-400 hover:!text-red-600"
                    title="Xoá"
                    type="button"
                    [disabled]="deletingProductId() === product.id"
                    (click)="deleteProduct(product)"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }

    <app-pagination
      [currentPage]="activePage()"
      [totalPages]="totalPages()"
      (pageChange)="goToPage($event)"
    ></app-pagination>
  </div>
</section>

<app-product-modal
  [isOpen]="showProductModal()"
  [isLoading]="savingProduct()"
  [product]="editingProduct()"
  [title]="editingProduct() ? 'Sửa sản phẩm' : 'Thêm sản phẩm'"
  [submitLabel]="editingProduct() ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'"
  (save)="saveProduct($event)"
  (cancel)="closeProductModal()"
></app-product-modal>

<app-delete-modal
  [isOpen]="showDeleteModal()"
  [isLoading]="deletingProductId() !== null"
  title="Xác nhận xóa sản phẩm"
  message="Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác."
  (confirm)="confirmDeleteProduct()"
  (cancel)="closeDeleteModal()"
></app-delete-modal>
  `,
})
export class AdminProductsList {
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly itemsPerPage = 10;

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly deletingProductId = signal<number | null>(null);
  readonly showDeleteModal = signal(false);
  readonly selectedProduct = signal<Product | null>(null);
  readonly showProductModal = signal(false);
  readonly editingProduct = signal<Product | null>(null);
  readonly savingProduct = signal(false);
  readonly currentPage = signal(1);
  readonly searchQuery = signal('');
  readonly filteredProducts = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.products();
    return this.products().filter((p) => p.name.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query));
  });
  readonly totalProducts = computed(() => this.filteredProducts().length);
  readonly sortedProducts = computed(() => {
    const items = [...this.filteredProducts()];
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.sortedProducts().length / this.itemsPerPage)));
  readonly activePage = computed(() => Math.min(Math.max(this.currentPage(), 1), this.totalPages()));
  readonly paginatedProducts = computed(() => {
    const startIndex = (this.activePage() - 1) * this.itemsPerPage;
    return this.sortedProducts().slice(startIndex, startIndex + this.itemsPerPage);
  });

  constructor() {
    this.productsService
      .getAll(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.products.set(items);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Không thể tải danh sách sản phẩm từ backend.');
          this.loading.set(false);
        },
      });

    this.categoriesService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
        },
      });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const page = Number(params.get('page') ?? '1');
      this.currentPage.set(Number.isInteger(page) && page > 0 ? page : 1);
    });
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories().find((c) => c.id === categoryId);
    return category ? category.name : `ID: ${categoryId}`;
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.goToPage(1);
  }

  trackByProductId(_: number, product: Product): number {
    return product.id;
  }

  openCreateModal(): void {
    this.editingProduct.set(null);
    this.showProductModal.set(true);
  }

  openEditModal(product: Product): void {
    this.editingProduct.set(product);
    this.showProductModal.set(true);
  }

  closeProductModal(): void {
    this.showProductModal.set(false);
    this.editingProduct.set(null);
    this.savingProduct.set(false);
  }

  saveProduct(event: ProductModalSaveEvent): void {
    const product = event.product;
    const payload = event.payload as CreateProductPayload | UpdateProductPayload;

    this.error.set(null);
    this.showProductModal.set(true);
    this.savingProduct.set(true);

    const request = product
      ? this.productsService.update(product.id, payload as UpdateProductPayload)
      : this.productsService.create(payload as CreateProductPayload);

    request.subscribe({
      next: (savedProduct) => {
        if (product) {
          this.products.update((items) => items.map((item) => (item.id === savedProduct.id ? savedProduct : item)));
          this.toast.success('Cập nhật sản phẩm thành công');
        } else {
          this.products.update((items) => [savedProduct, ...items]);
          this.toast.success('Thêm sản phẩm thành công');
          this.goToPage(1);
        }

        this.savingProduct.set(false);
        this.closeProductModal();
      },
      error: (err: unknown) => {
        this.toast.error(this.parseSaveError(err, !!product));
        this.savingProduct.set(false);
      },
    });
  }

  deleteProduct(product: Product): void {
    this.selectedProduct.set(product);
    this.showDeleteModal.set(true);
  }

  confirmDeleteProduct(): void {
    const product = this.selectedProduct();
    if (!product) return;

    this.showDeleteModal.set(false);
    this.deletingProductId.set(product.id);

    this.productsService.delete(product.id).subscribe({
      next: () => {
        this.products.update((items) => items.filter((item) => item.id !== product.id));
        this.ensureCurrentPageInRange();
        this.toast.success('Xóa sản phẩm thành công');
        this.deletingProductId.set(null);
        this.selectedProduct.set(null);
      },
      error: (err: unknown) => {
        this.toast.error(this.parseDeleteError(err));
        this.deletingProductId.set(null);
        this.selectedProduct.set(null);
      },
    });
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedProduct.set(null);
  }

  goToPage(page: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private ensureCurrentPageInRange(): void {
    if (this.currentPage() > this.totalPages()) {
      this.goToPage(this.totalPages());
    }
  }

  private parseSaveError(err: unknown, isUpdate: boolean): string {
    if (
      typeof err === 'object' &&
      err !== null &&
      'status' in err &&
      (err as { status?: number }).status === 401
    ) {
      return 'Bạn chưa đăng nhập hoặc token đã hết hạn.';
    }

    if (
      typeof err === 'object' &&
      err !== null &&
      'status' in err &&
      (err as { status?: number }).status === 403
    ) {
      return isUpdate
        ? 'Tài khoản hiện tại không có quyền cập nhật sản phẩm.'
        : 'Tài khoản hiện tại không có quyền thêm sản phẩm.';
    }

    if (
      typeof err === 'object' &&
      err !== null &&
      'error' in err &&
      typeof (err as { error?: unknown }).error === 'object' &&
      (err as { error?: { message?: string } }).error?.message
    ) {
      return (err as { error: { message: string } }).error.message;
    }

    return isUpdate
      ? 'Không thể cập nhật sản phẩm. Vui lòng thử lại.'
      : 'Không thể thêm sản phẩm. Vui lòng thử lại.';
  }

  private parseDeleteError(err: unknown): string {
    const status =
      typeof err === 'object' && err !== null && 'status' in err
        ? (err as { status?: number }).status
        : undefined;

    const apiMessage =
      typeof err === 'object' &&
      err !== null &&
      'error' in err &&
      typeof (err as { error?: unknown }).error === 'object' &&
      (err as { error?: { message?: string } }).error?.message
        ? (err as { error: { message: string } }).error.message
        : '';

    if (status === 401) {
      return 'Bạn chưa đăng nhập hoặc token đã hết hạn.';
    }

    if (status === 403) {
      return 'Tài khoản hiện tại không có quyền xóa sản phẩm.';
    }

    if (status === 409 || apiMessage.toLowerCase().includes('được dùng')) {
      return 'Không thể xóa sản phẩm này vì đang được sử dụng.';
    }

    return apiMessage || 'Không thể xóa sản phẩm. Vui lòng thử lại.';
  }
}
