import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoriesService, UpdateCategoryPayload } from './categories.service';
import { debounceTime, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Component({
	selector: 'app-admin-categories-edit',
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [ReactiveFormsModule],
	templateUrl: './edit.html',
})
export class AdminCategoriesEdit {
	private readonly fb = inject(FormBuilder);
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly categoriesService = inject(CategoriesService);

	readonly loading = signal(true);
	readonly submitting = signal(false);
	readonly error = signal<string | null>(null);
	readonly success = signal<string | null>(null);
	readonly categoryId = signal<number | null>(null);

	readonly form = this.fb.nonNullable.group({
		name: [
			'',
			[Validators.required, Validators.minLength(3), Validators.maxLength(100)],
			[this.createDuplicateNameValidator()],
		],
		icon: ['', [Validators.required, Validators.maxLength(10)]],
		sort_order: ['', [Validators.required, Validators.min(1)]],
	});

	constructor() {
		const id = Number(this.route.snapshot.paramMap.get('id'));
		if (!Number.isInteger(id) || id <= 0) {
			this.error.set('ID danh mục không hợp lệ.');
			this.loading.set(false);
			return;
		}

		this.categoryId.set(id);

		this.categoriesService.getById(id).subscribe({
			next: (category) => {
				this.form.patchValue({
					name: category.name ?? '',
					icon: category.icon ?? '',
					sort_order: String(category.sort_order ?? ''),
				});
				this.loading.set(false);
			},
			error: (err: unknown) => {
				this.error.set(this.parseError(err, false));
				this.loading.set(false);
			},
		});
	}

	get name() {
		return this.form.controls.name;
	}

	get icon() {
		return this.form.controls.icon;
	}

	get sortOrder() {
		return this.form.controls.sort_order;
	}

	private createDuplicateNameValidator() {
		return (control: AbstractControl): Observable<ValidationErrors | null> => {
			if (!control.value) {
				return of(null);
			}
			const currentId = this.categoryId();
			return this.categoriesService.checkNameExists(control.value, currentId ?? undefined).pipe(
				debounceTime(300),
				map((exists) => (exists ? { duplicateName: true } : null)),
			);
		};
	}

	submit(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		const id = this.categoryId();
		if (!id) {
			this.error.set('Không xác định được danh mục cần sửa.');
			return;
		}

		const formValue = this.form.getRawValue();
		const payload: UpdateCategoryPayload = {
			name: formValue.name.trim(),
			icon: formValue.icon.trim() || null,
			sort_order: Number(formValue.sort_order),
		};

		this.error.set(null);
		this.success.set(null);
		this.submitting.set(true);

		this.categoriesService.update(id, payload).subscribe({
			next: () => {
				this.success.set('Cập nhật danh mục thành công. Đang quay lại danh sách...');
				void this.router.navigate(['/admin/categories/list'], {
					queryParams: { updated: '1' },
				});
			},
			error: (err: unknown) => {
				this.error.set(this.parseError(err, true));
				this.submitting.set(false);
			},
		});
	}

	navigateToList(): void {
		void this.router.navigate(['/admin/categories/list']);
	}

	private parseError(err: unknown, isUpdate: boolean): string {
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
			return isUpdate
				? 'Tài khoản hiện tại không có quyền sửa danh mục.'
				: 'Tài khoản hiện tại không có quyền xem danh mục.';
		}

		if (
			typeof err === 'object' &&
			err !== null &&
			'status' in err &&
			(err as { status?: number }).status === 404
		) {
			return 'Không tìm thấy danh mục cần sửa.';
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

		return isUpdate
			? 'Không thể cập nhật danh mục. Vui lòng thử lại.'
			: 'Không thể tải thông tin danh mục. Vui lòng thử lại.';
	}
}
