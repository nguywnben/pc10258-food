import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { AdminMembershipService, MembershipPlan } from '../../../services/admin-membership.service';
import { MembershipModalComponent, MembershipModalSaveEvent } from '../../../components/membership-modal/membership-modal.component';
import { DeleteModalComponent } from '../../../components/delete-modal/delete-modal.component';
import { PaginationComponent } from '../../../components/pagination/pagination.component';

@Component({
  selector: 'app-admin-memberships',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, DeleteModalComponent, PaginationComponent, MembershipModalComponent],
  templateUrl: './memberships.html',
})
export class AdminMemberships {
  private readonly membershipService = inject(AdminMembershipService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly itemsPerPage = 10;

  readonly plans = signal<MembershipPlan[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showSuccessToast = signal(false);
  readonly successToastMessage = signal('Thêm hạng thành công');
  readonly showErrorToast = signal(false);
  readonly errorToastMessage = signal('Không thể xóa hạng.');
  readonly deletingPlanId = signal<number | null>(null);
  readonly showDeleteModal = signal(false);
  readonly selectedPlan = signal<MembershipPlan | null>(null);
  readonly showMembershipModal = signal(false);
  readonly editingPlan = signal<MembershipPlan | null>(null);
  readonly savingPlan = signal(false);
  readonly currentPage = signal(1);
  readonly searchQuery = signal('');
  readonly filteredPlans = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.plans();
    return this.plans().filter((plan) => plan.name.toLowerCase().includes(query));
  });
  readonly totalPlans = computed(() => this.filteredPlans().length);
  readonly sortedPlans = computed(() => {
    const plans = [...this.filteredPlans()];
    return plans.sort((a, b) => (a.price || 0) - (b.price || 0)); // ascending by price
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.sortedPlans().length / this.itemsPerPage)));
  readonly activePage = computed(() => Math.min(Math.max(this.currentPage(), 1), this.totalPages()));
  readonly paginatedPlans = computed(() => {
    const startIndex = (this.activePage() - 1) * this.itemsPerPage;
    return this.sortedPlans().slice(startIndex, startIndex + this.itemsPerPage);
  });

  constructor() {
    this.membershipService
      .getAllPlans()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (plans) => {
          this.plans.set(plans || []);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Không thể tải danh sách hạng từ backend.');
          this.loading.set(false);
        },
      });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const page = Number(params.get('page') ?? '1');
      this.currentPage.set(Number.isInteger(page) && page > 0 ? page : 1);
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.goToPage(1);
  }

  trackByPlanId(_: number, plan: MembershipPlan): number {
    return plan.id || 0;
  }

  readonly Array = Array;

  openCreateModal(): void {
    this.editingPlan.set(null);
    this.showMembershipModal.set(true);
  }

  openEditModal(plan: MembershipPlan): void {
    this.editingPlan.set(plan);
    this.showMembershipModal.set(true);
  }

  closeMembershipModal(): void {
    this.showMembershipModal.set(false);
    this.editingPlan.set(null);
    this.savingPlan.set(false);
  }

  savePlan(event: MembershipModalSaveEvent): void {
    const plan = event.plan;
    const payload = event.payload as Partial<MembershipPlan>;

    this.savingPlan.set(true);

    const request = plan
      ? this.membershipService.updatePlan(plan.id!, payload)
      : this.membershipService.createPlan(payload as MembershipPlan);

    request.subscribe({
      next: (savedPlan) => {
        if (plan) {
          this.plans.update((items) =>
            items.map((item) => (item.id === savedPlan.id ? savedPlan : item)),
          );
          this.successToastMessage.set('Cập nhật hạng thành công');
        } else {
          this.plans.update((items) => [savedPlan, ...items]);
          this.successToastMessage.set('Thêm hạng thành công');
          this.goToPage(1);
        }

        this.savingPlan.set(false);
        this.closeMembershipModal();
        this.openSuccessToast();
      },
      error: (err: unknown) => {
        this.errorToastMessage.set(this.parseSaveError(err, !!plan));
        this.savingPlan.set(false);
        this.openErrorToast();
      },
    });
  }

  deletePlan(plan: MembershipPlan): void {
    this.selectedPlan.set(plan);
    this.showDeleteModal.set(true);
  }

  confirmDeletePlan(): void {
    const plan = this.selectedPlan();
    if (!plan || !plan.id) return;

    this.deletingPlanId.set(plan.id);
    this.membershipService.deletePlan(plan.id).subscribe({
      next: () => {
        this.plans.update((items) => items.filter((p) => p.id !== plan.id));
        this.deletingPlanId.set(null);
        this.closeDeleteModal();
        this.successToastMessage.set('Xóa hạng thành công');
        this.openSuccessToast();
      },
      error: (err: unknown) => {
        this.errorToastMessage.set(this.parseDeleteError(err));
        this.deletingPlanId.set(null);
        this.openErrorToast();
      },
    });
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedPlan.set(null);
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
    return isUpdate ? 'Không thể cập nhật hạng.' : 'Không thể tạo hạng.';
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
    return 'Không thể xóa hạng.';
  }
}
