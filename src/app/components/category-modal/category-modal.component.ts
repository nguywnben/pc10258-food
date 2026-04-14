import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CategoriesService, Category, CreateCategoryPayload, UpdateCategoryPayload } from '../../services/categories.service';
import { Observable, of } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

export interface CategoryModalSaveEvent {
  category: Category | null;
  payload: CreateCategoryPayload | UpdateCategoryPayload;
}

@Component({
  selector: 'app-category-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
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
            <div class="md:col-span-1">
              <label for="category-name" class="form-label">Tên danh mục <span class="text-red-400">*</span></label>
              <input
                id="category-name"
                type="text"
                class="form-input"
                formControlName="name"
                placeholder="VD: Pizza"
              />
              @if (name.invalid && (name.dirty || name.touched)) {
                @if (name.hasError('required')) {
                  <p class="mt-1 text-xs text-red-500">Vui lòng nhập tên danh mục.</p>
                }
                @if (name.hasError('minlength')) {
                  <p class="mt-1 text-xs text-red-500">Tên danh mục phải có ít nhất 3 ký tự.</p>
                }
                @if (name.hasError('maxlength')) {
                  <p class="mt-1 text-xs text-red-500">Tên danh mục tối đa 100 ký tự.</p>
                }
                @if (name.hasError('duplicateName')) {
                  <p class="mt-1 text-xs text-red-500">Tên danh mục này đã tồn tại.</p>
                }
              }
            </div>

            <div class="md:col-span-1">
              <label for="category-status" class="form-label">Trạng thái <span class="text-red-400">*</span></label>
              <select id="category-status" class="form-input" formControlName="status">
                <option [value]="1">Hoạt động</option>
                <option [value]="0">Ngừng hoạt động</option>
              </select>
            </div>

            <div>
              <label for="category-icon" class="form-label">Biểu tượng (icon) <span class="text-red-400">*</span></label>
              <input
                id="category-icon"
                type="text"
                class="form-input"
                formControlName="icon"
                placeholder="VD: 🍕"
              />
              @if (icon.invalid && (icon.dirty || icon.touched)) {
                @if (icon.hasError('required')) {
                  <p class="mt-1 text-xs text-red-500">Vui lòng nhập biểu tượng.</p>
                }
                @if (icon.hasError('maxlength')) {
                  <p class="mt-1 text-xs text-red-500">Biểu tượng tối đa 10 ký tự.</p>
                }
              }
            </div>

            <div>
              <label for="category-sort-order" class="form-label">Thứ tự hiển thị <span class="text-red-400">*</span></label>
              <input
                id="category-sort-order"
                type="number"
                class="form-input"
                formControlName="sort_order"
                placeholder="VD: 1"
              />
              @if (sortOrder.invalid && (sortOrder.dirty || sortOrder.touched)) {
                @if (sortOrder.hasError('required')) {
                  <p class="mt-1 text-xs text-red-500">Thứ tự hiển thị là bắt buộc.</p>
                }
                @if (sortOrder.hasError('min')) {
                  <p class="mt-1 text-xs text-red-500">Thứ tự hiển thị phải lớn hơn 0.</p>
                }
                @if (sortOrder.hasError('duplicateSortOrder')) {
                  <p class="mt-1 text-xs text-red-500">Thứ tự hiển thị này đã tồn tại.</p>
                }
              }
            </div>

            <div class="md:col-span-2 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
              <button
                type="button"
                class="btn btn-outline"
                [disabled]="isLoading()"
                (click)="cancel.emit()"
              >
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
export class CategoryModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);

  readonly isOpen = input(false);
  readonly isLoading = input(false);
  readonly title = input('Thêm danh mục');
  readonly subtitle = input('Nhập thông tin danh mục để quản lý menu món ăn.');
  readonly submitLabel = input('Lưu danh mục');
  readonly category = input<Category | null>(null);

  readonly save = output<CategoryModalSaveEvent>();
  readonly cancel = output<void>();

  readonly form = this.fb.nonNullable.group({
    name: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
      [this.createDuplicateNameValidator()],
    ],
    icon: ['', [Validators.required, Validators.maxLength(10)]],
    sort_order: [1, [Validators.required, Validators.min(1)], [this.createDuplicateSortOrderValidator()]],
    status: [1, [Validators.required]],
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        this.form.reset({ name: '', icon: '', sort_order: 1, status: 1 });
        this.form.markAsPristine();
        this.form.markAsUntouched();
        return;
      }

      const category = this.category();
      this.form.reset({
        name: category?.name ?? '',
        icon: category?.icon ?? '',
        sort_order: category?.sort_order ?? 1,
        status: category?.status ?? 1,
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
      this.name.updateValueAndValidity();
      this.sortOrder.updateValueAndValidity();
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

  get status() {
    return this.form.controls.status;
  }

  private createDuplicateNameValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      const currentId = this.category()?.id;
      return this.categoriesService.checkNameExists(control.value, currentId).pipe(
        debounceTime(300),
        map((exists) => (exists ? { duplicateName: true } : null)),
      );
    };
  }

  private createDuplicateSortOrderValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      const currentId = this.category()?.id;
      return this.categoriesService.checkSortOrderExists(Number(control.value), currentId).pipe(
        debounceTime(300),
        map((exists) => (exists ? { duplicateSortOrder: true } : null)),
      );
    };
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const payload: CreateCategoryPayload | UpdateCategoryPayload = {
      name: formValue.name.trim(),
      icon: formValue.icon.trim() || null,
      sort_order: Number(formValue.sort_order),
      status: Number(formValue.status),
    };

    this.save.emit({
      category: this.category(),
      payload,
    });
  }
}
