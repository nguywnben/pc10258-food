import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DeleteModalComponent } from '../../../components/delete-modal/delete-modal.component';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { User, UsersService } from '../../../services/users.service';
import { ToastService } from '../../../components/toast/toast.service';

@Component({
  selector: 'app-admin-users-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DeleteModalComponent, PaginationComponent, ReactiveFormsModule],
  templateUrl: './list.html',
})
export class AdminUsersList {
  private readonly usersService = inject(UsersService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly itemsPerPage = 10;

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showDeleteModal = signal(false);
  readonly selectedUser = signal<User | null>(null);
  readonly showEditModal = signal(false);
  readonly editingUser = signal<User | null>(null);
  readonly deletingUserId = signal<number | null>(null);
  readonly savingUserId = signal<number | null>(null);
  readonly currentPage = signal(1);

  readonly editForm = this.fb.nonNullable.group({
    full_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    phone: ['', [Validators.pattern(/^[0-9]{9,11}$/)]],
    role: ['client' as 'client' | 'admin', [Validators.required]],
    membership: ['free' as 'free' | 'premium', [Validators.required]],
  });

  readonly totalUsers = computed(() => this.users().length);
  readonly sortedUsers = computed(() => {
    const items = [...this.users()];
    return items.sort((a, b) => {
      const timeA = new Date(a.created_at ?? 0).getTime();
      const timeB = new Date(b.created_at ?? 0).getTime();
      return timeB - timeA;
    });
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.sortedUsers().length / this.itemsPerPage)));
  readonly activePage = computed(() => Math.min(Math.max(this.currentPage(), 1), this.totalPages()));
  readonly paginatedUsers = computed(() => {
    const startIndex = (this.activePage() - 1) * this.itemsPerPage;
    return this.sortedUsers().slice(startIndex, startIndex + this.itemsPerPage);
  });

  constructor() {
    this.usersService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.users.set(users);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(this.parseLoadError(err));
          this.loading.set(false);
        },
      });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const page = Number(params.get('page') ?? '1');
      this.currentPage.set(Number.isInteger(page) && page > 0 ? page : 1);
    });
  }

  trackByUserId(_: number, user: User): number {
    return user.id;
  }

  displayUserName(user: User): string {
    return user.full_name || user.name || user.username || 'Chưa cập nhật';
  }

  displayRole(role: string | null | undefined): string {
    if (role === 'admin') {
      return 'Quản trị viên';
    }
    if (role === 'client') {
      return 'Người dùng';
    }
    return 'Người dùng';
  }

  displayMembership(membership: User['membership']): string {
    return membership === 'premium' ? 'Premium' : 'Free';
  }

  openEditModal(user: User): void {
    this.editingUser.set(user);
    this.editForm.reset({
      full_name: (user.full_name || user.name || '').trim(),
      phone: (user.phone || '').trim(),
      role: user.role === 'admin' ? 'admin' : 'client',
      membership: user.membership === 'premium' ? 'premium' : 'free',
    });
    this.showEditModal.set(true);
  }

  saveUser(): void {
    const user = this.editingUser();
    if (!user) return;

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.savingUserId.set(user.id);
    
    // Giả lập lưu thành công vì backend chưa có API
    setTimeout(() => {
      const updatedData = this.editForm.value;
      this.users.update(items => items.map(item => item.id === user.id ? { ...item, ...updatedData } : item));
      this.toast.success('Cập nhật người dùng thành công');
      this.savingUserId.set(null);
      this.closeEditModal();
    }, 500);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingUser.set(null);
  }

  openLockModal(user: User): void {
    this.selectedUser.set(user);
    this.showDeleteModal.set(true);
  }

  closeLockModal(): void {
    this.showDeleteModal.set(false);
    this.selectedUser.set(null);
  }

  confirmLockUser(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.showDeleteModal.set(false);
    this.deletingUserId.set(user.id);

    this.usersService.delete(user.id).subscribe({
      next: () => {
        this.users.update((items) => items.filter((item) => item.id !== user.id));
        this.ensureCurrentPageInRange();
        this.toast.success('Xóa người dùng thành công');
        this.deletingUserId.set(null);
        this.selectedUser.set(null);
      },
      error: (err: unknown) => {
        this.toast.error(this.parseDeleteError(err));
        this.deletingUserId.set(null);
        this.selectedUser.set(null);
      },
    });
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

  private parseLoadError(err: unknown): string {
    if (
      typeof err === 'object' &&
      err !== null &&
      'status' in err &&
      (err as { status?: number }).status === 403
    ) {
      return 'Bạn không có quyền xem danh sách người dùng.';
    }

    return 'Không thể tải danh sách người dùng.';
  }

  private parseDeleteError(err: unknown): string {
    if (
      typeof err === 'object' &&
      err !== null &&
      'status' in err &&
      (err as { status?: number }).status === 403
    ) {
      return 'Bạn không có quyền xóa người dùng.';
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

    return 'Không thể xóa người dùng. Vui lòng thử lại.';
  }
}
