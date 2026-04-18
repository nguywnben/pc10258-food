import { AfterViewInit, ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, switchMap } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../components/toast/toast.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register implements AfterViewInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly registerForm = this.formBuilder.nonNullable.group({
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(9)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    acceptTerms: [false, [Validators.requiredTrue]],
  });

  readonly passwordMismatch = computed(() => {
    const { password, confirmPassword } = this.registerForm.getRawValue();
    return confirmPassword.length > 0 && password !== confirmPassword;
  });

  ngAfterViewInit(): void {
    if (typeof document === 'undefined') return;
    if (document.querySelector('script#food-main-js')) return;

    const script = document.createElement('script');
    script.id = 'food-main-js';
    script.src = 'assets/js/main.js';
    document.body.appendChild(script);
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.passwordMismatch() || this.isSubmitting()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.submitError.set(null);
    this.isSubmitting.set(true);

    const { full_name, email, phone, password } = this.registerForm.getRawValue();
    const normalizedFullName = full_name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const normalizedPassword = password;

    this.authService
      .register({
        full_name: normalizedFullName,
        email: normalizedEmail,
        phone: normalizedPhone,
        password: normalizedPassword,
      })
      .pipe(
        switchMap(() => this.authService.login({ email: normalizedEmail, password: normalizedPassword })),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: () => {
          this.toast.success('Đăng ký thành công! Chào mừng bạn.');
          void this.router.navigate(['/']);
        },
        error: (errorResponse: HttpErrorResponse) => {
          const apiMessage = errorResponse.error?.message;
          if (typeof apiMessage === 'string' && apiMessage.toLowerCase().includes('email')) {
            const msg = 'Email đã tồn tại, vui lòng dùng email khác.';
            this.submitError.set(msg);
            this.toast.error(msg);
            return;
          }

          const errorMsg = typeof apiMessage === 'string' ? apiMessage : 'Đăng ký thất bại, vui lòng thử lại.';
          this.submitError.set(errorMsg);
          this.toast.error(errorMsg);
        },
      });
  }
}

