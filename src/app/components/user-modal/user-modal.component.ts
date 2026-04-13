import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../services/users.service';

type UserModalPayload = {
  full_name: string;
  phone: string | null;
  role: 'client' | 'admin';
  is_active: boolean;
};

export interface UserModalSaveEvent {
  user: User;
  payload: UserModalPayload;
}

@Component({
  selector: 'app-user-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-[9998] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
          <div class="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 class="text-xl font-bold text-ink">{{ title() }}</h3>
              <p class="mt-1 text-sm text-ink-light">{{ subtitle() }}</p>
            </div>
            <button
              type="button"
              class="rounded-xl p-2 text-ink-lighter transition hover:bg-gray-50 hover:text-ink"
              (click)="cancel.emit()"
              aria-label="Đóng"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <form [formGroup]="form" class="grid grid-cols-1 gap-5 md:grid-cols-2" (ngSubmit)="submit()">
            <div class="md:col-span-2">
              <label for="user-full-name" class="form-label">Họ tên <span class="text-red-400">*</span></label>
              <input
                id="user-full-name"
                type="text"
                class="form-input"
                formControlName="full_name"
                placeholder="VD: Nguyễn Văn A"
              />
              @if (fullName.invalid && (fullName.dirty || fullName.touched)) {
                @if (fullName.hasError('required')) {
                  <p class="mt-1 text-xs text-red-500">Vui lòng nhập họ tên.</p>
                }
                @if (fullName.hasError('minlength')) {
                  <p class="mt-1 text-xs text-red-500">Họ tên phải có ít nhất 2 ký tự.</p>
                }
                @if (fullName.hasError('maxlength')) {
                  <p class="mt-1 text-xs text-red-500">Họ tên tối đa 120 ký tự.</p>
                }
              }
            </div>

            <div>
              <label for="user-phone" class="form-label">Số điện thoại</label>
              <input
                id="user-phone"
                type="text"
                class="form-input"
                formControlName="phone"
                placeholder="VD: 0912345678"
              />
              @if (phone.invalid && (phone.dirty || phone.touched)) {
                @if (phone.hasError('pattern')) {
                  <p class="mt-1 text-xs text-red-500">Số điện thoại chỉ gồm 9-11 chữ số.</p>
                }
              }
            </div>

            <div>
              <label for="user-role" class="form-label">Vai trò <span class="text-red-400">*</span></label>
              <select id="user-role" class="form-input" formControlName="role">
                <option value="client">Người dùng</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label for="user-status" class="form-label">Trạng thái</label>
              <select id="user-status" class="form-input" formControlName="is_active">
                <option [ngValue]="true">Đang hoạt động</option>
                <option [ngValue]="false">Đã khóa</option>
              </select>
            </div>

            <div class="md:col-span-2 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
              <button type="button" class="btn btn-outline" [disabled]="isLoading()" (click)="cancel.emit()">
                Hủy bỏ
              </button>
              <button type="submit" class="btn btn-brand" [disabled]="isLoading()">
                @if (isLoading()) {
                  Đang lưu...
                } @else {
                  {{ submitLabel() }}
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class UserModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly isOpen = input(false);
  readonly isLoading = input(false);
  readonly title = input('Chỉnh sửa người dùng');
  readonly subtitle = input('Chỉ chỉnh sửa các thông tin phù hợp: họ tên, số điện thoại, vai trò, trạng thái.');
  readonly submitLabel = input('Lưu thay đổi');
  readonly user = input<User | null>(null);

  readonly save = output<UserModalSaveEvent>();
  readonly cancel = output<void>();

  readonly form = this.fb.nonNullable.group({
    full_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    phone: ['', [Validators.pattern(/^[0-9]{9,11}$/)]],
    role: ['client', [Validators.required]],
    is_active: [true, [Validators.required]],
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        this.form.reset({
          full_name: '',
          phone: '',
          role: 'client',
          is_active: true,
        });
        this.form.markAsPristine();
        this.form.markAsUntouched();
        return;
      }

      const user = this.user();
      this.form.reset({
        full_name: (user?.full_name || user?.name || '').trim(),
        phone: (user?.phone || '').trim(),
        role: user?.role === 'admin' ? 'admin' : 'client',
        is_active: true,
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
    });
  }

  get fullName() {
    return this.form.controls.full_name;
  }

  get phone() {
    return this.form.controls.phone;
  }

  submit(): void {
    const currentUser = this.user();
    if (!currentUser) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.save.emit({
      user: currentUser,
      payload: {
        full_name: this.fullName.value.trim(),
        phone: this.phone.value.trim() || null,
        role: this.form.controls.role.value as 'client' | 'admin',
        is_active: this.form.controls.is_active.value,
      },
    });
  }
}
