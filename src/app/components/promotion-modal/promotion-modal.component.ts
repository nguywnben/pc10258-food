import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Promotion } from '../../services/admin-promotion.service';

export interface PromotionModalSaveEvent {
  promotion: Promotion | null;
  payload: Partial<Promotion>;
}

@Component({
  selector: 'app-promotion-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-[9998] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="w-full max-w-3xl rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
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
              <label for="promo-code" class="form-label">Mã Code <span class="text-red-400">*</span></label>
              <input
                id="promo-code"
                type="text"
                class="form-input uppercase"
                formControlName="code"
                placeholder="VD: TET2025, COMBO20"
              />
              @if (code.invalid && (code.dirty || code.touched)) {
                @if (code.hasError('required')) {
                  <p class="mt-1 text-xs text-red-500">Vui lòng nhập mã code.</p>
                }
                @if (code.hasError('minlength')) {
                  <p class="mt-1 text-xs text-red-500">Mã code phải có ít nhất 2 ký tự.</p>
                }
                @if (code.hasError('maxlength')) {
                  <p class="mt-1 text-xs text-red-500">Mã code tối đa 50 ký tự.</p>
                }
              }
            </div>

            <div class="md:col-span-1">
              <label for="promo-type" class="form-label">Loại Giảm <span class="text-red-400">*</span></label>
              <select id="promo-type" class="form-input" formControlName="discount_type">
                <option value="percent">Giảm theo %</option>
                <option value="fixed">Giảm cố định (VNĐ)</option>
              </select>
            </div>

            <div class="md:col-span-1">
              <label for="promo-value" class="form-label">Giá Trị Giảm <span class="text-red-400">*</span></label>
              <input
                id="promo-value"
                type="number"
                class="form-input"
                formControlName="discount_value"
                min="0"
                placeholder="VD: 20 (%) hoặc 50000 (VNĐ)"
              />
              @if (discountValue.invalid && (discountValue.dirty || discountValue.touched)) {
                @if (discountValue.hasError('required')) {
                  <p class="mt-1 text-xs text-red-500">Vui lòng nhập giá trị giảm.</p>
                }
                @if (discountValue.hasError('min')) {
                  <p class="mt-1 text-xs text-red-500">Giá trị giảm không được âm.</p>
                }
              }
            </div>

            <div class="md:col-span-1">
              <label for="promo-min-order" class="form-label">Đơn Tối Thiểu (VNĐ) <span class="text-red-400">*</span></label>
              <input
                id="promo-min-order"
                type="number"
                class="form-input"
                formControlName="min_order"
                min="0"
                placeholder="VD: 100000"
              />
              @if (minOrder.invalid && (minOrder.dirty || minOrder.touched)) {
                @if (minOrder.hasError('required')) {
                  <p class="mt-1 text-xs text-red-500">Vui lòng nhập đơn tối thiểu.</p>
                }
                @if (minOrder.hasError('min')) {
                  <p class="mt-1 text-xs text-red-500">Đơn tối thiểu không được âm.</p>
                }
              }
            </div>

            <div class="md:col-span-1">
              <label for="promo-max-uses" class="form-label">Giới Hạn Số Lần Dùng (NULL = Không Giới Hạn)</label>
              <input
                id="promo-max-uses"
                type="number"
                class="form-input"
                formControlName="max_uses"
                min="1"
                placeholder="VD: 100"
              />
            </div>

            <div class="md:col-span-1">
              <label for="promo-start" class="form-label">Ngày Bắt Đầu <span class="text-red-400">*</span></label>
              <input
                id="promo-start"
                type="datetime-local"
                class="form-input"
                formControlName="start_date"
              />
              @if (startDate.invalid && (startDate.dirty || startDate.touched)) {
                @if (startDate.hasError('required')) {
                  <p class="mt-1 text-xs text-red-500">Vui lòng chọn ngày bắt đầu.</p>
                }
              }
            </div>

            <div class="md:col-span-1">
              <label for="promo-end" class="form-label">Ngày Kết Thúc <span class="text-red-400">*</span></label>
              <input
                id="promo-end"
                type="datetime-local"
                class="form-input"
                formControlName="end_date"
              />
              @if (endDate.invalid && (endDate.dirty || endDate.touched)) {
                @if (endDate.hasError('required')) {
                  <p class="mt-1 text-xs text-red-500">Vui lòng chọn ngày kết thúc.</p>
                }
              }
            </div>

            <div class="md:col-span-2">
              <label for="promo-description" class="form-label">Mô Tả <span class="text-red-400">*</span></label>
              <textarea
                id="promo-description"
                class="form-input min-h-20 resize-none"
                formControlName="description"
                placeholder="VD: Giảm 20% đón năm mới cho đơn từ 150k..."
              ></textarea>
              @if (description.invalid && (description.dirty || description.touched)) {
                @if (description.hasError('required')) {
                  <p class="mt-1 text-xs text-red-500">Vui lòng nhập mô tả.</p>
                }
                @if (description.hasError('maxlength')) {
                  <p class="mt-1 text-xs text-red-500">Mô tả tối đa 255 ký tự.</p>
                }
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
export class PromotionModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly isOpen = input<boolean>(false);
  readonly isLoading = input<boolean>(false);
  readonly promotion = input<Promotion | null>(null);
  readonly title = input<string>('Tạo Mã Khuyến Mãi');
  readonly subtitle = input<string>('Thiết lập chi tiết chương trình giảm giá');
  readonly submitLabel = input<string>('Tạo Mã');

  readonly save = output<PromotionModalSaveEvent>();
  readonly cancel = output<void>();

  readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    discount_type: ['percent', Validators.required],
    discount_value: [0, [Validators.required, Validators.min(0)]],
    min_order: [0, [Validators.required, Validators.min(0)]],
    max_uses: [null as any],
    start_date: ['', Validators.required],
    end_date: ['', Validators.required],
    description: ['', [Validators.required, Validators.maxLength(255)]],
  });

  get code(): AbstractControl<any> {
    return this.form.get('code')!;
  }

  get discountValue(): AbstractControl<any> {
    return this.form.get('discount_value')!;
  }

  get minOrder(): AbstractControl<any> {
    return this.form.get('min_order')!;
  }

  get startDate(): AbstractControl<any> {
    return this.form.get('start_date')!;
  }

  get endDate(): AbstractControl<any> {
    return this.form.get('end_date')!;
  }

  get description(): AbstractControl<any> {
    return this.form.get('description')!;
  }

  constructor() {
    effect(() => {
      const promo = this.promotion();
      if (promo && this.isOpen()) {
        const startDate = this.formatDateTimeForInput(promo.start_date);
        const endDate = this.formatDateTimeForInput(promo.end_date);
        
        this.form.patchValue({
          code: promo.code,
          discount_type: promo.discount_type,
          discount_value: promo.discount_value,
          min_order: promo.min_order,
          max_uses: promo.max_uses,
          start_date: startDate,
          end_date: endDate,
          description: promo.description,
        });
      } else if (!this.isOpen()) {
        this.form.reset({
          code: '',
          discount_type: 'percent',
          discount_value: 0,
          min_order: 0,
          max_uses: null,
          start_date: '',
          end_date: '',
          description: '',
        });
      }
    });
  }

  private formatDateTimeForInput(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.value as Partial<Promotion>;
    this.save.emit({
      promotion: this.promotion(),
      payload: formValue,
    });
  }
}
