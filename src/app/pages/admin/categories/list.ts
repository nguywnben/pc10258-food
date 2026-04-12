import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoriesService, Category } from './categories.service';

@Component({
  selector: 'app-admin-categories-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './list.html',
})
export class AdminCategoriesList {
  private readonly categoriesService = inject(CategoriesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly totalCategories = computed(() => this.categories().length);

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
  }

  trackByCategoryId(_: number, category: Category): number {
    return category.id;
  }
}