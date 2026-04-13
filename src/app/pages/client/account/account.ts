import { AfterViewInit, ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { AddressListResponse, AddressRecord } from '../../../core/models/account.model';

const passwordMatchValidator = (control: AbstractControl): ValidationErrors | null => {
  const newPassword = control.get('new_password')?.value as string | undefined;
  const confirmPassword = control.get('confirm_password')?.value as string | undefined;

  if (!newPassword || !confirmPassword) {
    return null;
  }

  return newPassword === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './account.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Account implements AfterViewInit, OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
  private readonly authService = inject(AuthService);

  readonly profileLoading = signal(true);
  readonly profileSaving = signal(false);
  readonly profileMessage = signal<string | null>(null);
  readonly profileError = signal<string | null>(null);

  readonly passwordSaving = signal(false);
  readonly passwordMessage = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);

  readonly addressesLoading = signal(true);
  readonly addressesSaving = signal(false);
  readonly addressMessage = signal<string | null>(null);
  readonly addressError = signal<string | null>(null);
  readonly editingAddressId = signal<number | null>(null);
  readonly addresses = signal<AddressRecord[]>([]);

  readonly currentUser = computed(() => this.authService.user());

  readonly profileForm = this.formBuilder.nonNullable.group({
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\s-]{9,20}$/)]],
  });

  readonly passwordForm = this.formBuilder.nonNullable.group(
    {
      current_password: ['', [Validators.required, Validators.minLength(6)]],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', [Validators.required, Validators.minLength(6)]],
    },
    { validators: [passwordMatchValidator] }
  );

  readonly addressForm = this.formBuilder.nonNullable.group({
    label: ['Nhà riêng', [Validators.required, Validators.minLength(2)]],
    full_address: ['', [Validators.required, Validators.minLength(8)]],
    is_default: [false],
  });

  constructor() {
    const user = this.authService.user();
    if (user) {
      this.profileForm.patchValue({
        full_name: user.full_name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
      });
    }
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadAddresses();
  }

  ngAfterViewInit(): void {
    if (typeof document === 'undefined') return;
    if (document.querySelector('script#food-main-js')) return;

    const script = document.createElement('script');
    script.id = 'food-main-js';
    script.src = 'assets/js/main.js';
    document.body.appendChild(script);
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.profileSaving()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileError.set(null);
    this.profileMessage.set(null);
    this.profileSaving.set(true);

    this.accountService
      .updateProfile(this.profileForm.getRawValue())
      .pipe(finalize(() => this.profileSaving.set(false)))
      .subscribe({
        next: (response) => {
          this.profileMessage.set(response.message);
          this.authService.updateUser({
            id: response.user.id,
            full_name: response.user.full_name,
            email: response.user.email,
            phone: response.user.phone,
            avatar_url: response.user.avatar_url ?? null,
            role: response.user.role,
            membership: response.user.membership,
          });
        },
        error: (errorResponse: HttpErrorResponse) => {
          this.profileError.set(this.resolveErrorMessage(errorResponse, 'Cập nhật thông tin thất bại.'));
        },
      });
  }

  savePassword(): void {
    if (this.passwordForm.invalid || this.passwordSaving()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordError.set(null);
    this.passwordMessage.set(null);
    this.passwordSaving.set(true);

    const { current_password, new_password } = this.passwordForm.getRawValue();

    this.accountService
      .changePassword({ current_password, new_password })
      .pipe(finalize(() => this.passwordSaving.set(false)))
      .subscribe({
        next: (response) => {
          this.passwordMessage.set(response.message);
          this.passwordForm.reset({ current_password: '', new_password: '', confirm_password: '' });
        },
        error: (errorResponse: HttpErrorResponse) => {
          this.passwordError.set(this.resolveErrorMessage(errorResponse, 'Đổi mật khẩu thất bại.'));
        },
      });
  }

  saveAddress(): void {
    if (this.addressForm.invalid || this.addressesSaving()) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.addressError.set(null);
    this.addressMessage.set(null);
    this.addressesSaving.set(true);

    const payload = this.addressForm.getRawValue();
    const request$ = this.editingAddressId()
      ? this.accountService.updateAddress(this.editingAddressId() as number, payload)
      : this.accountService.createAddress(payload);

    request$
      .pipe(finalize(() => this.addressesSaving.set(false)))
      .subscribe({
        next: (response) => {
          this.addressMessage.set(response.message);
          this.resetAddressForm();
          this.loadAddresses();
        },
        error: (errorResponse: HttpErrorResponse) => {
          this.addressError.set(this.resolveErrorMessage(errorResponse, 'Lưu địa chỉ thất bại.'));
        },
      });
  }

  editAddress(address: AddressRecord): void {
    this.editingAddressId.set(address.id);
    this.addressForm.patchValue({
      label: address.label,
      full_address: address.full_address,
      is_default: !!address.is_default,
    });
    this.addressMessage.set(null);
    this.addressError.set(null);
  }

  cancelAddressEdit(): void {
    this.resetAddressForm();
  }

  setDefaultAddress(address: AddressRecord): void {
    this.addressError.set(null);
    this.addressMessage.set(null);
    this.addressesSaving.set(true);

    this.accountService
      .updateAddress(address.id, { is_default: true })
      .pipe(finalize(() => this.addressesSaving.set(false)))
      .subscribe({
        next: (response) => {
          this.addressMessage.set(response.message);
          this.loadAddresses();
        },
        error: (errorResponse: HttpErrorResponse) => {
          this.addressError.set(this.resolveErrorMessage(errorResponse, 'Cập nhật địa chỉ mặc định thất bại.'));
        },
      });
  }

  deleteAddress(address: AddressRecord): void {
    if (!confirm(`Xóa địa chỉ "${address.label}"?`)) {
      return;
    }

    this.addressError.set(null);
    this.addressMessage.set(null);
    this.addressesSaving.set(true);

    this.accountService
      .deleteAddress(address.id)
      .pipe(finalize(() => this.addressesSaving.set(false)))
      .subscribe({
        next: (response) => {
          this.addressMessage.set(response.message);
          if (this.editingAddressId() === address.id) {
            this.resetAddressForm();
          }
          this.loadAddresses();
        },
        error: (errorResponse: HttpErrorResponse) => {
          this.addressError.set(this.resolveErrorMessage(errorResponse, 'Xóa địa chỉ thất bại.'));
        },
      });
  }

  isDefaultAddress(address: AddressRecord): boolean {
    return Number(address.is_default) === 1;
  }

  private loadProfile(): void {
    this.profileLoading.set(true);
    this.accountService
      .getProfile()
      .pipe(finalize(() => this.profileLoading.set(false)))
      .subscribe({
        next: (response) => {
          const profile = response.data;
          this.profileForm.patchValue({
            full_name: profile.full_name ?? '',
            email: profile.email ?? '',
            phone: profile.phone ?? '',
          });
          this.authService.updateUser({
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            avatar_url: profile.avatar_url ?? null,
            role: profile.role,
            membership: profile.membership,
          });
        },
        error: (errorResponse: HttpErrorResponse) => {
          this.profileError.set(this.resolveErrorMessage(errorResponse, 'Không tải được hồ sơ.'));
        },
      });
  }

  private loadAddresses(): void {
    this.addressesLoading.set(true);
    this.accountService
      .getAddresses()
      .pipe(finalize(() => this.addressesLoading.set(false)))
      .subscribe({
        next: (response: AddressListResponse) => {
          this.addresses.set(response.data ?? []);
        },
        error: (errorResponse: HttpErrorResponse) => {
          this.addressError.set(this.resolveErrorMessage(errorResponse, 'Không tải được danh sách địa chỉ.'));
          this.addresses.set([]);
        },
      });
  }

  private resetAddressForm(): void {
    this.editingAddressId.set(null);
    this.addressForm.reset({
      label: 'Nhà riêng',
      full_address: '',
      is_default: false,
    });
  }

  private resolveErrorMessage(errorResponse: HttpErrorResponse, fallbackMessage: string): string {
    const apiMessage = errorResponse.error?.message;
    if (typeof apiMessage === 'string') {
      return apiMessage;
    }

    const apiError = errorResponse.error?.error;
    if (typeof apiError === 'string' && apiError.trim()) {
      return apiError;
    }

    return fallbackMessage;
  }

}

