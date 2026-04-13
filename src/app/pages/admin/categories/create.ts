import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoriesService, CreateCategoryPayload } from './categories.service';

@Component({
	selector: 'app-admin-categories-create',
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [ReactiveFormsModule],
	templateUrl: './create.html',
})
export class AdminCategoriesCreate {
	private readonly fb = inject(FormBuilder);
	private readonly router = inject(Router);
	private readonly categoriesService = inject(CategoriesService);

	readonly submitting = signal(false);
	readonly error = signal<string | null>(null);
	readonly success = signal<string | null>(null);

	readonly form = this.fb.nonNullable.group({
		name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
		icon: ['', [Validators.required, Validators.maxLength(10)]],
		sort_order: ['', [Validators.required, Validators.min(1)]],
	});

	get name() {
		return this.form.controls.name;
	}

	get icon() {
		return this.form.controls.icon;
	}

	get sortOrder() {
		return this.form.controls.sort_order;
	}

	submit(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		const formValue = this.form.getRawValue();
		const payload: CreateCategoryPayload = {
			name: formValue.name.trim(),
			icon: formValue.icon.trim() || null,
			sort_order: Number(formValue.sort_order),
		};

		this.error.set(null);
		this.success.set(null);
		this.submitting.set(true);

		this.categoriesService.create(payload).subscribe({
			next: () => {
				this.success.set('Thêm danh mục thành công. Đang quay lại danh sách...');
				void this.router.navigate(['/admin/categories/list'], {
					queryParams: { created: '1' },
				});
			},
			error: (err: unknown) => {
				const message = this.parseError(err);
				this.error.set(message);
				this.submitting.set(false);
			},
		});
	}

	private parseError(err: unknown): string {
		if (
			typeof err === 'object' &&
			err !== null &&
			'status' in err &&
			(err as { status?: number }).status === 401
		) {
			return 'Bạn chưa đăng nhập hoặc token đã hết hạn.';
		}

		if (
			typeof err === 'object' &&
			err !== null &&
			'status' in err &&
			(err as { status?: number }).status === 403
		) {
			return 'Tài khoản hiện tại không có quyền thêm danh mục.';
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

		return 'Không thể thêm danh mục. Vui lòng thử lại.';
	}

	navigateToList(): void {
		void this.router.navigate(['/admin/categories/list']);
	}
}
