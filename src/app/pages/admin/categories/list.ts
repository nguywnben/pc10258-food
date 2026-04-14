import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoriesService, Category, CreateCategoryPayload, UpdateCategoryPayload } from '../../../services/categories.service';
import { CategoryModalComponent, CategoryModalSaveEvent } from '../../../components/category-modal/category-modal.component';
import { DeleteModalComponent } from '../../../components/delete-modal/delete-modal.component';
import { PaginationComponent } from '../../../components/pagination/pagination.component';

@Component({
  selector: 'app-admin-categories-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DeleteModalComponent, PaginationComponent, CategoryModalComponent],
  templateUrl: './list.html',
})
export class AdminCategoriesList {
  private readonly categoriesService = inject(CategoriesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly itemsPerPage = 10;

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showSuccessToast = signal(false);
  readonly successToastMessage = signal('Thêm danh mục thành công');
  readonly showErrorToast = signal(false);
  readonly errorToastMessage = signal('Không thể xóa danh mục.');
  readonly deletingCategoryId = signal<number | null>(null);
  readonly showDeleteModal = signal(false);
  readonly selectedCategory = signal<Category | null>(null);
  readonly showCategoryModal = signal(false);
  readonly editingCategory = signal<Category | null>(null);
  readonly savingCategory = signal(false);
  readonly currentPage = signal(1);
  readonly totalCategories = computed(() => this.categories().length);
  readonly sortedCategories = computed(() => {
    const cats = [...this.categories()];
    return cats.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // descending order (newest first)
    });
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.sortedCategories().length / this.itemsPerPage)));
  readonly activePage = computed(() => Math.min(Math.max(this.currentPage(), 1), this.totalPages()));
  readonly paginatedCategories = computed(() => {
    const startIndex = (this.activePage() - 1) * this.itemsPerPage;
    return this.sortedCategories().slice(startIndex, startIndex + this.itemsPerPage);
  });

  constructor() {
    this.categoriesService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Không thể tải danh sách danh mục từ backend.');
          this.loading.set(false);
        },
      });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const page = Number(params.get('page') ?? '1');
      this.currentPage.set(Number.isInteger(page) && page > 0 ? page : 1);

    });
  }

  trackByCategoryId(_: number, category: Category): number {
    return category.id;
  }

  openCreateModal(): void {
    this.editingCategory.set(null);
    this.showCategoryModal.set(true);
  }

  openEditModal(category: Category): void {
    this.editingCategory.set(category);
    this.showCategoryModal.set(true);
  }

  closeCategoryModal(): void {
    this.showCategoryModal.set(false);
    this.editingCategory.set(null);
    this.savingCategory.set(false);
  }

  saveCategory(event: CategoryModalSaveEvent): void {
    const category = event.category;
    const payload = event.payload as CreateCategoryPayload | UpdateCategoryPayload;

    this.savingCategory.set(true);

    const request = category
      ? this.categoriesService.update(category.id, payload as UpdateCategoryPayload)
      : this.categoriesService.create(payload as CreateCategoryPayload);

    request.subscribe({
      next: (savedCategory) => {
        if (category) {
          this.categories.update((items) =>
            items.map((item) => (item.id === savedCategory.id ? savedCategory : item)),
          );
          this.successToastMessage.set('Cập nhật danh mục thành công');
        } else {
          this.categories.update((items) => [savedCategory, ...items]);
          this.successToastMessage.set('Thêm danh mục thành công');
          this.goToPage(1);
        }

        this.savingCategory.set(false);
        this.closeCategoryModal();
        this.openSuccessToast();
      },
      error: (err: unknown) => {
        this.errorToastMessage.set(this.parseSaveError(err, !!category));
        this.savingCategory.set(false);
        this.openErrorToast();
      },
    });
  }

  deleteCategory(category: Category): void {
    this.selectedCategory.set(category);
    this.showDeleteModal.set(true);
  }

  confirmDeleteCategory(): void {
    const category = this.selectedCategory();
    if (!category) return;

    this.showDeleteModal.set(false);
    this.deletingCategoryId.set(category.id);

    this.categoriesService.delete(category.id).subscribe({
      next: () => {
        this.categories.update((items) => items.filter((item) => item.id !== category.id));
        this.ensureCurrentPageInRange();
        this.successToastMessage.set('Xóa danh mục thành công');
        this.openSuccessToast();
        this.deletingCategoryId.set(null);
        this.selectedCategory.set(null);
      },
      error: (err: unknown) => {
        this.errorToastMessage.set(this.parseDeleteError(err));
        this.openErrorToast();
        this.deletingCategoryId.set(null);
        this.selectedCategory.set(null);
      },
    });
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedCategory.set(null);
  }

  goToPage(page: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  dismissSuccessToast(): void {
    this.showSuccessToast.set(false);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: this.activePage() },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  dismissErrorToast(): void {
    this.showErrorToast.set(false);
  }

  private openSuccessToast(): void {
    this.showSuccessToast.set(true);

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.dismissSuccessToast();
    }, 3000);
  }

  private openErrorToast(): void {
    this.showErrorToast.set(true);

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.dismissErrorToast();
    }, 3500);
  }

  private ensureCurrentPageInRange(): void {
    if (this.currentPage() > this.totalPages()) {
      this.goToPage(this.totalPages());
    }
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
      return 'Tài khoản hiện tại không có quyền xóa danh mục.';
    }

    if (status === 400 || status === 409 || apiMessage.toLowerCase().includes('sản phẩm')) {
      return 'Không thể xóa danh mục vì danh mục này đang có sản phẩm.';
    }

    return apiMessage || 'Không thể xóa danh mục. Vui lòng thử lại.';
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
        ? 'Tài khoản hiện tại không có quyền sửa danh mục.'
        : 'Tài khoản hiện tại không có quyền thêm danh mục.';
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
      ? 'Không thể cập nhật danh mục. Vui lòng thử lại.'
      : 'Không thể thêm danh mục. Vui lòng thử lại.';
  }
}