import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-center w-full max-w-sm p-4 rounded-xl shadow-lg border bg-white animate-slide-in-right"
          [class.border-emerald-200]="toast.type === 'success'"
          [class.border-red-200]="toast.type === 'error'"
          [class.border-amber-200]="toast.type === 'warning'"
          role="alert"
        >
          @switch (toast.type) {
            @case ('success') {
              <div class="inline-flex items-center justify-center shrink-0 w-8 h-8 text-emerald-600 bg-emerald-100 rounded-lg">
                <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 11.917 9.724 16.5 19 7.5"/>
                </svg>
              </div>
            }
            @case ('error') {
              <div class="inline-flex items-center justify-center shrink-0 w-8 h-8 text-red-600 bg-red-100 rounded-lg">
                <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18 17.94 6M18 18 6.06 6"/>
                </svg>
              </div>
            }
            @case ('warning') {
              <div class="inline-flex items-center justify-center shrink-0 w-8 h-8 text-amber-600 bg-amber-100 rounded-lg">
                <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
              </div>
            }
          }

          <div class="ms-3 text-sm font-medium text-gray-800 flex-1">{{ toast.message }}</div>

          <button
            type="button"
            class="ms-3 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1.5 transition focus:outline-none focus:ring-2 focus:ring-gray-200"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Close"
          >
            <span class="sr-only">Close</span>
            <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      position: relative;
      z-index: 9999;
    }

    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(1rem); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .animate-slide-in-right {
      animation: slideInRight .25s ease-out;
    }
  `]
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);

  /** @deprecated Use ToastService directly instead */
  displayToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastService.show(msg, type);
  }
}
