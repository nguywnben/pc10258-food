import { AfterViewInit, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements AfterViewInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
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
    if (this.loginForm.invalid || this.isSubmitting()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password;

    if (!normalizedEmail || !normalizedPassword) {
      this.submitError.set('Vui lòng nhập email và mật khẩu hợp lệ.');
      return;
    }

    this.submitError.set(null);
    this.isSubmitting.set(true);

    this.authService
      .login({ email: normalizedEmail, password: normalizedPassword })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/']);
        },
        error: (errorResponse: HttpErrorResponse) => {
          const errorBody = errorResponse.error;
          const apiMessage =
            (typeof errorBody?.message === 'string' && errorBody.message) ||
            (typeof errorBody?.error === 'string' && errorBody.error) ||
            (Array.isArray(errorBody?.errors) && typeof errorBody.errors[0] === 'string' && errorBody.errors[0]) ||
            (typeof errorBody === 'string' && errorBody) ||
            null;

          if (!apiMessage && errorResponse.status === 400) {
            this.submitError.set('Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.');
            return;
          }

          this.submitError.set(
            typeof apiMessage === 'string' ? apiMessage : `Đăng nhập thất bại (HTTP ${errorResponse.status || 0}).`
          );
        },
      });
  }
}

