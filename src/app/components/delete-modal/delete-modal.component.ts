import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-[9998] flex items-center justify-center bg-black/35 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div class="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
          <div class="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-5">
            <svg
              class="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-primary">{{ title() }}</h3>
          <p class="mt-3 text-sm text-gray-500 leading-relaxed">
            {{ message() }}
          </p>
          <div class="mt-8 flex justify-end gap-3">
            <button
              type="button"
              (click)="onCancelClick()"
              [disabled]="isLoading()"
              class="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              (click)="onConfirmClick()"
              [disabled]="isLoading()"
              class="rounded-xl bg-red-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-600 shadow-lg shadow-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              @if (isLoading()) {
                <svg
                  class="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              }
              Xác nhận xóa
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DeleteModalComponent {
  readonly isOpen = input(false);
  readonly title = input('Xác nhận xóa');
  readonly message = input('Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác.');
  readonly isLoading = input(false);

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  onConfirmClick(): void {
    this.confirm.emit();
  }

  onCancelClick(): void {
    this.cancel.emit();
  }
}
