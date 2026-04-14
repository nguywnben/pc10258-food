import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateProductPayload, Product, UpdateProductPayload } from '../../services/products.service';

export interface ProductModalSaveEvent {
  product: Product | null;
  payload: CreateProductPayload | UpdateProductPayload;
}

@Component({
  selector: 'app-product-modal',
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
              <label for="product-name" class="form-label">Tên sản phẩm <span class="text-red-400">*</span></label>
              <input
                id="product-name"
                type="text"
                class="form-input"
                formControlName="name"
                placeholder="VD: Pizza Neapolitan"
              />
              @if (name.invalid && (name.dirty || name.touched)) {
                @if (name.hasError('required')) {
                  <p class="mt-1 text-xs text-red-500">Vui lòng nhập tên sản phẩm.</p>
                }
                @if (name.hasError('minlength')) {
                  <p class="mt-1 text-xs text-red-500">Tên sản phẩm phải có ít nhất 2 ký tự.</p>
                }
                @if (name.hasError('maxlength')) {
                  <p class="mt-1 text-xs text-red-500">Tên sản phẩm tối đa 120 ký tự.</p>
                }
              }
            </div>

            <div class="md:col-span-2">
              <label for="product-image-url" class="form-label">Hình ảnh (URL) <span class="text-red-400">*</span></label>
              <input
                id="product-image-url"
                type="text"
                class="form-input"
                formControlName="image_url"
                placeholder="VD: assets/images/neapolitan.png"
              />
              @if (imageUrl.invalid && (imageUrl.dirty || imageUrl.touched)) {
                @if (imageUrl.hasError('required')) {
                  <p class="mt-1 text-xs text-red-500">Vui lòng nhập hình ảnh cho sản phẩm.</p>
                }
                @if (imageUrl.hasError('maxlength')) {
                  <p class="mt-1 text-xs text-red-500">Đường dẫn hình ảnh tối đa 255 ký tự.</p>
                }
              }
              <div class="mt-3 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                <div class="flex items-center gap-3 p-3">
                  <img
                    [src]="imagePreviewSrc()"
                    [alt]="name.value || 'Ảnh sản phẩm'"
                    class="h-16 w-16 rounded-xl object-cover"
                  />
                  <div>
                    <p class="text-sm font-semibold text-ink">Xem trước hình</p>
                    <p class="text-xs text-ink-light">Hình sẽ được lấy từ đường dẫn bạn nhập.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label for="product-price" class="form-label">Giá bán (₫) <span class="text-red-400">*</span></label>
              <input
                id="product-price"
                type="number"
                class="form-input"
                formControlName="price"
                placeholder="VD: 145000"
              />
              @if (price.invalid && (price.dirty || price.touched)) {
                @if (price.hasError('required')) {
                  <p class="mt-1 text-xs text-red-500">Vui lòng nhập giá bán.</p>
                }
                @if (price.hasError('min')) {
                  <p class="mt-1 text-xs text-red-500">Giá bán phải lớn hơn hoặc bằng 0.</p>
                }
              }
            </div>

            <div class="flex flex-col justify-end gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-wider text-ink-lighter">Lưu ý</p>
              <p class="text-sm text-ink-light">Bạn có thể dùng modal này để thêm mới hoặc cập nhật món ăn.</p>
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
export class ProductModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly isOpen = input(false);
  readonly isLoading = input(false);
  readonly title = input('Thêm sản phẩm');
  readonly subtitle = input('Nhập tên món, hình ảnh và giá bán để quản lý sản phẩm.');
  readonly submitLabel = input('Lưu sản phẩm');
  readonly product = input<Product | null>(null);

  readonly save = output<ProductModalSaveEvent>();
  readonly cancel = output<void>();

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    image_url: ['', [Validators.required, Validators.maxLength(255)]],
    price: [0, [Validators.required, Validators.min(0)]],
  });

  readonly imagePreviewSrc = () => this.imageUrl.value || 'assets/images/placeholder.png';

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        this.form.reset({ name: '', image_url: '', price: 0 });
        this.form.markAsPristine();
        this.form.markAsUntouched();
        return;
      }

      const product = this.product();
      this.form.reset({
        name: product?.name ?? '',
        image_url: product?.image_url ?? '',
        price: product?.price ?? 0,
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
    });
  }

  get name() {
    return this.form.controls.name;
  }

  get imageUrl() {
    return this.form.controls.image_url;
  }

  get price() {
    return this.form.controls.price;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.save.emit({
      product: this.product(),
      payload: {
        name: this.name.value.trim(),
        image_url: this.imageUrl.value.trim(),
        price: Number(this.price.value),
      },
    });
  }
}
