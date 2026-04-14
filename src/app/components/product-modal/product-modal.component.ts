import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, PLATFORM_ID } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateProductPayload, Product, UpdateProductPayload } from '../../services/products.service';
import { CategoriesService, Category } from '../../services/categories.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

export interface ProductModalSaveEvent {
  product: Product | null;
  payload: CreateProductPayload | UpdateProductPayload;
}

@Component({
  selector: 'app-product-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, CKEditorModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-[9998] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 h-[90vh] overflow-y-auto">
          <div class="mb-5 flex items-start justify-between gap-4 sticky top-0 bg-white z-10 pb-2">
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
                @if (name.hasError('maxlength')) {
                  <p class="mt-1 text-xs text-red-500">Tên sản phẩm tối đa 120 ký tự.</p>
                }
              }
            </div>

            <div class="md:col-span-1">
              <label for="product-category" class="form-label">Danh mục <span class="text-red-400">*</span></label>
              <select id="product-category" class="form-input" formControlName="category_id">
                <option value="" disabled>-- Chọn danh mục --</option>
                @for (cat of categories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
              @if (categoryId.invalid && (categoryId.dirty || categoryId.touched)) {
                <p class="mt-1 text-xs text-red-500">Vui lòng chọn danh mục.</p>
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

            <div class="md:col-span-2">
              <label for="product-description" class="form-label">Mô tả sản phẩm</label>
              <div class="ck-editor-container">
                @if (isBrowser() && Editor) {
                  <ckeditor
                    [editor]="Editor"
                    formControlName="description"
                    [config]="{ placeholder: 'Nhập mô tả chi tiết món ăn...' }"
                  ></ckeditor>
                } @else {
                  <div class="h-[150px] w-full rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-ink-lighter text-sm">
                    Đang tải trình soạn thảo...
                  </div>
                }
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

            <div>
              <label for="product-status" class="form-label">Trạng thái hiện tại <span class="text-red-400">*</span></label>
              <select id="product-status" class="form-input" formControlName="is_available">
                <option [value]="1">Đang kinh doanh</option>
                <option [value]="0">Ngừng kinh doanh</option>
              </select>
            </div>

            <div class="md:col-span-1">
              <label for="product-delivery-info" class="form-label">Thông tin giao hàng</label>
              <input
                id="product-delivery-info"
                type="text"
                class="form-input"
                formControlName="delivery_info"
                placeholder="VD: Giao miễn phí"
              />
            </div>

            <div class="md:col-span-1">
              <label for="product-delivery-time" class="form-label">Thời gian giao dự kiến</label>
              <input
                id="product-delivery-time"
                type="text"
                class="form-input"
                formControlName="delivery_time"
                placeholder="VD: 10–15 phút"
              />
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
  private readonly categoriesService = inject(CategoriesService);
  private readonly platformId = inject(PLATFORM_ID);

  public Editor: any;
  public isBrowser = signal(false);

  readonly isOpen = input(false);
  readonly isLoading = input(false);
  readonly title = input('Thêm sản phẩm');
  readonly subtitle = input('Nhập thông tin sản phẩm để quản lý kho hàng.');
  readonly submitLabel = input('Lưu sản phẩm');
  readonly product = input<Product | null>(null);

  readonly save = output<ProductModalSaveEvent>();
  readonly cancel = output<void>();

  readonly categories = signal<Category[]>([]);

  readonly form = this.fb.nonNullable.group({
    category_id: ['', [Validators.required]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    image_url: ['', [Validators.required, Validators.maxLength(500)]],
    is_available: [1, [Validators.required]],
    delivery_info: ['Giao miễn phí'],
    delivery_time: ['10–15 phút'],
  });

  constructor() {
    this.isBrowser.set(isPlatformBrowser(this.platformId));

    if (this.isBrowser()) {
      import('@ckeditor/ckeditor5-build-classic').then((ck) => {
        this.Editor = ck.default;
      });
    }

    this.categoriesService.getAll().pipe(takeUntilDestroyed()).subscribe(cats => {
      this.categories.set(cats);
    });

    effect(() => {
      if (!this.isOpen()) {
        this.form.reset({
          category_id: '',
          name: '',
          description: '',
          price: 0,
          image_url: '',
          is_available: 1,
          delivery_info: 'Giao miễn phí',
          delivery_time: '10–15 phút',
        });
        return;
      }

      const product = this.product();
      if (product) {
        this.form.reset({
          category_id: String(product.category_id),
          name: product.name,
          description: product.description ?? '',
          price: product.price,
          image_url: product.image_url ?? '',
          is_available: product.is_available,
          delivery_info: product.delivery_info ?? 'Giao miễn phí',
          delivery_time: product.delivery_time ?? '10–15 phút',
        });
      }
    });
  }

  get categoryId() { return this.form.controls.category_id; }
  get name() { return this.form.controls.name; }
  get price() { return this.form.controls.price; }
  get imageUrl() { return this.form.controls.image_url; }

  imagePreviewSrc() {
    return this.imageUrl.value || 'assets/images/placeholder.png';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const payload: CreateProductPayload | UpdateProductPayload = {
      category_id: Number(formValue.category_id),
      name: formValue.name.trim(),
      description: formValue.description?.trim() || null,
      price: Number(formValue.price),
      image_url: formValue.image_url.trim() || null,
      is_available: Number(formValue.is_available),
      delivery_info: formValue.delivery_info?.trim() || 'Giao miễn phí',
      delivery_time: formValue.delivery_time?.trim() || '10–15 phút',
    };

    this.save.emit({
      product: this.product(),
      payload,
    });
  }
}
