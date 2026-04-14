import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPages() > 1) {
      <div class="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-ink-light">
          Trang {{ currentPage() }} / {{ totalPages() }}
        </p>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="btn btn-outline !px-4 !py-2 !text-xs"
            [disabled]="currentPage() === 1"
            (click)="previousPage()"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          @for (page of pageNumbers(); track page) {
            <button
              type="button"
              class="btn !px-4 !py-2 !text-xs"
              [class.btn-brand]="page === currentPage()"
              [class.btn-outline]="page !== currentPage()"
              (click)="selectPage(page)"
            >
              {{ page }}
            </button>
          }

          <button
            type="button"
            class="btn btn-outline !px-4 !py-2 !text-xs"
            [disabled]="currentPage() === totalPages()"
            (click)="nextPage()"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    }
  `,
})
export class PaginationComponent {
  readonly currentPage = input(1);
  readonly totalPages = input(1);
  readonly pageChange = output<number>();

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  selectPage(page: number): void {
    this.pageChange.emit(page);
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }
}
