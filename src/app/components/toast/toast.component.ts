import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error';
  id?: string;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="show()" 
      class="fixed top-5 right-5 z-[9999] transition-all duration-300 ease-out"
      [class.translate-x-0]="show()"
      [class.opacity-100]="show()"
      [class.translate-x-12]="!show()"
      [class.opacity-0]="!show()"
      [class.pointer-events-none]="!show()">
      <div [ngClass]="getWrapperClass()" class="min-w-[280px] max-w-[360px] rounded-xl border px-4 py-3 shadow-lg">
        <div class="flex items-start gap-3">
          <div [ngClass]="getIconClass()" class="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold">
            {{ currentType() === 'error' ? '!' : '✓' }}
          </div>
          <div class="flex-1">
            <p class="text-sm font-bold leading-5">{{ currentType() === 'error' ? 'Lỗi' : 'Thành công' }}</p>
            <p class="mt-0.5 text-sm leading-5">{{ message() }}</p>
          </div>
          <button type="button" (click)="close()" class="text-base leading-none opacity-70 hover:opacity-100">×</button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ToastComponent {
  show = signal(false);
  message = signal('');
  currentType = signal<'success' | 'error'>('success');
  private timeoutId: any;

  constructor() {
    effect(() => {
      if (this.show()) {
        // Clear previous timeout if exists
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
        }
        
        // Auto-close after 3 seconds
        this.timeoutId = setTimeout(() => {
          this.close();
        }, 3000);
      }
    });
  }

  displayToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.message.set(msg);
    this.currentType.set(type);
    this.show.set(true);
  }

  close(): void {
    this.show.set(false);
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  getWrapperClass(): string {
    const baseClass = this.currentType() === 'error' 
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-green-200 bg-green-50 text-green-700';
    return baseClass;
  }

  getIconClass(): string {
    const baseClass = this.currentType() === 'error'
      ? 'bg-red-100 text-red-600'
      : 'bg-green-100 text-green-600';
    return baseClass;
  }
}
