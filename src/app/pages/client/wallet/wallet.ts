import { AfterViewInit, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [],
  templateUrl: './wallet.html',
})
export class Wallet implements AfterViewInit {
  private readonly router = inject(Router);

  /** Tránh `action="/payment"` (GET) — sẽ reload cả SPA; dùng router thay thế. */
  continueToPayment(event: SubmitEvent): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const fd = new FormData(form);
    const type = (fd.get('type') as string) || 'deposit';
    const amount = (fd.get('amount') as string) || '';
    const method = (fd.get('method') as string) || 'bank';
    void this.router.navigate(['/payment'], {
      queryParams: { type, amount, method },
    });
  }

  ngAfterViewInit(): void {
    if (typeof document === 'undefined') return;
    if (document.querySelector('script#food-main-js')) return;

    const script = document.createElement('script');
    script.id = 'food-main-js';
    script.src = 'assets/js/main.js';
    document.body.appendChild(script);
  }
}

