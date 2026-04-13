import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CategoriesService, Category } from './categories.service';

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
        this.openSuccessToast();
      }
    });
  }

  trackByCategoryId(_: number, category: Category): number {
    return category.id;
  }

  dismissSuccessToast(): void {
    this.showSuccessToast.set(false);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { created: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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
}