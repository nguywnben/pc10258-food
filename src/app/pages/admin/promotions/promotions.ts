import { Component, OnInit, inject, ChangeDetectionStrategy, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { AdminPromotionService, Promotion } from '../../../services/admin-promotion.service';
import { PromotionModalComponent, PromotionModalSaveEvent } from '../../../components/promotion-modal/promotion-modal.component';
import { DeleteModalComponent } from '../../../components/delete-modal/delete-modal.component';
import { PaginationComponent } from '../../../components/pagination/pagination.component';

@Component({
  selector: 'app-admin-promotions',
  standalone: true,
  imports: [CommonModule, PromotionModalComponent, DeleteModalComponent, PaginationComponent],
  templateUrl: './promotions.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminPromotions implements OnInit {
  private readonly promoService = inject(AdminPromotionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly itemsPerPage = 10;

  readonly promotions = signal<Promotion[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showSuccessToast = signal(false);
  readonly successToastMessage = signal('Thành công');
  readonly showErrorToast = signal(false);
  readonly errorToastMessage = signal('Có lỗi xảy ra');
  readonly deletingPromotionId = signal<number | null>(null);
  readonly showDeleteModal = signal(false);
  readonly selectedPromotion = signal<Promotion | null>(null);
  readonly showPromotionModal = signal(false);
  readonly editingPromotion = signal<Promotion | null>(null);
  readonly savingPromotion = signal(false);
  readonly currentPage = signal(1);
  readonly searchQuery = signal('');

  readonly filteredPromotions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.promotions();
    return this.promotions().filter(
      (promo) => promo.code.toLowerCase().includes(query) || promo.description.toLowerCase().includes(query)
    );
  });

  readonly totalPromotions = computed(() => this.filteredPromotions().length);
  readonly sortedPromotions = computed(() => {
    const promos = [...this.filteredPromotions()];
    return promos.sort((a, b) => (new Date(b.created_at || '').getTime()) - (new Date(a.created_at || '').getTime()));
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.sortedPromotions().length / this.itemsPerPage)));
  readonly activePage = computed(() => Math.min(Math.max(this.currentPage(), 1), this.totalPages()));
  readonly paginatedPromotions = computed(() => {
    const startIndex = (this.activePage() - 1) * this.itemsPerPage;
    return this.sortedPromotions().slice(startIndex, startIndex + this.itemsPerPage);
  });

  readonly Array = Array;

  ngOnInit() {
    this.loadPromotions();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const page = Number(params.get('page') ?? '1');
      this.currentPage.set(Number.isInteger(page) && page > 0 ? page : 1);
    });
  }

  loadPromotions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.promoService.getAllPromotions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (promos) => {
        this.promotions.set(promos || []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Không thể tải danh sách khuyến mãi');
        this.loading.set(false);
      }
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.goToPage(1);
  }

  trackByPromotionId(_: number, promo: Promotion): number {
    return promo.id || 0;
  }

  openCreateModal(): void {
    this.editingPromotion.set(null);
    this.showPromotionModal.set(true);
  }

  openEditModal(promo: Promotion): void {
    this.editingPromotion.set(promo);
    this.showPromotionModal.set(true);
  }

  closePromotionModal(): void {
    this.showPromotionModal.set(false);
    this.editingPromotion.set(null);
    this.savingPromotion.set(false);
  }

  savePromotion(event: PromotionModalSaveEvent): void {
    const promo = event.promotion;
    const payload = event.payload as Partial<Promotion>;

    this.savingPromotion.set(true);

    const request = promo
      ? this.promoService.updatePromotion(promo.id!, payload)
      : this.promoService.createPromotion(payload as Promotion);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (savedPromo) => {
        if (promo) {
          this.promotions.update((items) =>
            items.map((item) => (item.id === savedPromo.id ? savedPromo : item))
          );
          this.successToastMessage.set('Cập nhật khuyến mãi thành công');
        } else {
          this.promotions.update((items) => [savedPromo, ...items]);
          this.successToastMessage.set('Tạo khuyến mãi thành công');
          this.goToPage(1);
        }

        this.savingPromotion.set(false);
        this.closePromotionModal();
        this.openSuccessToast();
      },
      error: (err: unknown) => {
        this.errorToastMessage.set(this.parseSaveError(err, !!promo));
        this.savingPromotion.set(false);
        this.openErrorToast();
      }
    });
  }

  deletePromotion(promo: Promotion): void {
    this.selectedPromotion.set(promo);
    this.showDeleteModal.set(true);
  }

  confirmDeletePromotion(): void {
    const promo = this.selectedPromotion();
    if (!promo || !promo.id) return;

    this.deletingPromotionId.set(promo.id);
    this.promoService.deletePromotion(promo.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.promotions.update((items) => items.filter((p) => p.id !== promo.id));
        this.deletingPromotionId.set(null);
        this.closeDeleteModal();
        this.successToastMessage.set('Xóa khuyến mãi thành công');
        this.openSuccessToast();
      },
      error: (err: unknown) => {
        this.errorToastMessage.set(this.parseDeleteError(err));
        this.deletingPromotionId.set(null);
        this.openErrorToast();
      }
    });
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedPromotion.set(null);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  private openSuccessToast(): void {
    this.showSuccessToast.set(true);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.dismissSuccessToast(), 3000);
  }

  dismissSuccessToast(): void {
    this.showSuccessToast.set(false);
  }

  private openErrorToast(): void {
    this.showErrorToast.set(true);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.dismissErrorToast(), 4000);
  }

  dismissErrorToast(): void {
    this.showErrorToast.set(false);
  }

  private parseSaveError(err: unknown, isUpdate: boolean): string {
    if (err instanceof Error && err.message) {
      return err.message;
    }
    if (typeof err === 'object' && err !== null) {
      const error = err as any;
      if (error.error?.message) {
        return error.error.message;
      }
    }
    return isUpdate ? 'Không thể cập nhật khuyến mãi.' : 'Không thể tạo khuyến mãi.';
  }

  private parseDeleteError(err: unknown): string {
    if (err instanceof Error && err.message) {
      return err.message;
    }
    if (typeof err === 'object' && err !== null) {
      const error = err as any;
      if (error.error?.message) {
        return error.error.message;
      }
    }
    return 'Không thể xóa khuyến mãi.';
  }
}
