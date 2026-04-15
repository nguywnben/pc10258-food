import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MembershipPlan } from '../../services/admin-membership.service';

export interface MembershipModalSaveEvent {
  plan: MembershipPlan | null;
  payload: Partial<MembershipPlan>;
}

@Component({
  selector: 'app-membership-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CommonModule],
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
              <label for="plan-name" class="form-label">Tên Hạng <span class="text-red-400">*</span></label>
              <input
                id="plan-name"
                type="text"
                class="form-input"
                formControlName="name"
                placeholder="VD: Vàng, Bạc, Kim Cương"
              />
              @if (name.invalid && (name.dirty || name.touched)) {
                @if (name.hasError('required')) {
                  <p class="mt-1 text-xs text-red-500">Vui lòng nhập tên hạng.</p>
                }
                @if (name.hasError('minlength')) {
                  <p class="mt-1 text-xs text-red-500">Tên hạng phải có ít nhất 2 ký tự.</p>
                }
                @if (name.hasError('maxlength')) {
                  <p class="mt-1 text-xs text-red-500">Tên hạng tối đa 50 ký tự.</p>
                }
              }
            </div>

            <div class="md:col-span-1">
              <label for="plan-price" class="form-label">Giá tiền <span class="text-red-400">*</span></label>
              <input
                id="plan-price"
                type="number"
                class="form-input"
                formControlName="price"
                min="0"
                placeholder="VD: 199000"
              />
              @if (price.invalid && (price.dirty || price.touched)) {
                @if (price.hasError('required')) {
                  <p class="mt-1 text-xs text-red-500">Vui lòng nhập giá tiền.</p>
                }
                @if (price.hasError('min')) {
                  <p class="mt-1 text-xs text-red-500">Giá tiền không được âm.</p>
                }
              }
            </div>

            <div class="md:col-span-1">
              <label for="plan-is-popular" class="form-label flex items-center gap-2">
                <input
                  id="plan-is-popular"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-brand focus:ring-2 focus:ring-brand"
                  formControlName="is_popular"
                />
                <span>Hạng phổ biến</span>
              </label>
            </div>

            <div class="md:col-span-2">
              <label for="plan-features" class="form-label">Quyền lợi (cách nhau bằng dấu phẩy)</label>
              <textarea
                id="plan-features"
                class="form-input min-h-20 resize-none"
                formControlName="features"
                placeholder="VD: Giảm giá 5%, Ưu tiên giao hàng, Tặng voucher..."
              ></textarea>
              @if (features.hasError('maxlength')) {
                <p class="mt-1 text-xs text-red-500">Quyền lợi tối đa 500 ký tự.</p>
              }
            </div>

            <div class="col-span-1 md:col-span-2 flex items-center justify-end gap-3 border-t-2 border-gray-100 pt-5">
              <button
                type="button"
                class="btn btn-outline"
                (click)="cancel.emit()"
                [disabled]="isLoading()"
              >
                Hủy
              </button>
              <button
                type="submit"
                class="btn btn-brand"
                [disabled]="form.invalid || isLoading()"
              >
                @if (isLoading()) {
                  <svg class="animate-spin h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M12 4a8 8 0 018 8" stroke-linecap="round" />
                  </svg>
                }
                {{ submitLabel() }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class MembershipModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly isOpen = input<boolean>(false);
  readonly isLoading = input<boolean>(false);
  readonly plan = input<MembershipPlan | null>(null);
  readonly title = input<string>('Cấu hình Hạng Thành viên');
  readonly subtitle = input<string>('Thiết lập điểm và quyền lợi cho hạng này');
  readonly submitLabel = input<string>('Lưu');

  readonly save = output<MembershipModalSaveEvent>();
  readonly cancel = output<void>();

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    price: [0, [Validators.required, Validators.min(0)]],
    is_popular: [false],
    features: ['', [Validators.maxLength(500)]],
  });

  get name(): AbstractControl<any> {
    return this.form.get('name')!;
  }

  get price(): AbstractControl<any> {
    return this.form.get('price')!;
  }

  get isPopular(): AbstractControl<any> {
    return this.form.get('is_popular')!;
  }

  get features(): AbstractControl<any> {
    return this.form.get('features')!;
  }

  constructor() {
    effect(() => {
      const plan = this.plan();
      if (plan && this.isOpen()) {
        this.form.patchValue({
          name: plan.name,
          price: plan.price,
          is_popular: !!plan.is_popular,
          features: Array.isArray(plan.features) ? plan.features.join(', ') : plan.features || '',
        });
      } else if (!this.isOpen()) {
        this.form.reset({
          name: '',
          price: 0,
          is_popular: false,
          features: '',
        });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.value as Partial<MembershipPlan>;
    this.save.emit({
      plan: this.plan(),
      payload: formValue,
    });
  }
}
