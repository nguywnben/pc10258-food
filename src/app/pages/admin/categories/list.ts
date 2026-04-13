import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CategoriesService, Category } from '../../../services/categories.service';

@Component({
  selector: 'app-admin-categories-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  templateUrl: './list.html',
})
export class AdminCategoriesList {
  private readonly categoriesService = inject(CategoriesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showSuccessToast = signal(false);
  readonly successToastMessage = signal('Thêm danh mục thành công');
  readonly showErrorToast = signal(false);
  readonly errorToastMessage = signal('Không thể xóa danh mục.');
  readonly deletingCategoryId = signal<number | null>(null);
  readonly totalCategories = computed(() => this.categories().length);
  readonly sortedCategories = computed(() => {
    const cats = [...this.categories()];
    return cats.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // descending order (newest first)
    });
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
      if (params.get('created') === '1') {
        this.successToastMessage.set('Thêm danh mục thành công');
        this.openSuccessToast();
      }

      if (params.get('updated') === '1') {
        this.successToastMessage.set('Cập nhật danh mục thành công');
        this.openSuccessToast();
      }
    });
  }

  trackByCategoryId(_: number, category: Category): number {
    return category.id;
  }

  deleteCategory(category: Category): void {
    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`);

    if (!confirmed) {
      return;
    }

    this.deletingCategoryId.set(category.id);

    this.categoriesService.delete(category.id).subscribe({
      next: () => {
        this.categories.update((items) => items.filter((item) => item.id !== category.id));
        this.successToastMessage.set('Xóa danh mục thành công');
        this.openSuccessToast();
        this.deletingCategoryId.set(null);
      },
      error: (err: unknown) => {
        this.errorToastMessage.set(this.parseDeleteError(err));
        this.openErrorToast();
        this.deletingCategoryId.set(null);
      },
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
      queryParams: { created: null, updated: null },
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
}