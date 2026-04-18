import { AfterViewInit, Component, ViewChild, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletService, WalletTransaction } from '../../../services/wallet.service';
import { AuthService } from '../../../core/services/auth.service';
import { WalletDepositModalComponent } from '../../../components/wallet-deposit-modal/wallet-deposit-modal.component';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule, WalletDepositModalComponent],
  templateUrl: './wallet.html',
})
export class Wallet implements OnInit, AfterViewInit {
  @ViewChild(WalletDepositModalComponent) depositModal!: WalletDepositModalComponent;

  private readonly router = inject(Router);
  private readonly walletSvc = inject(WalletService);
  private readonly authSvc = inject(AuthService);

  // Signals
  walletBalance = signal<number>(0);
  transactions = signal<WalletTransaction[]>([]);
  isLoading = signal(true);
  selectedTimeFilter = signal<'7' | '30' | 'all'>('7');
  agreeConfirm = signal(false);
  isAuthenticated = computed(() => this.authSvc.isAuthenticated());
  
  // Pagination signals
  currentPage = signal(1);
  itemsPerPage = 5;
  totalItems = signal(0);

  // Computed
  filteredTransactions = computed(() => {
    const all = this.transactions();
    const filter = this.selectedTimeFilter();
    
    if (filter === 'all') return all;
    
    const days = parseInt(filter);
    const now = new Date();
    const filterDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return all.filter(t => new Date(t.created_at) >= filterDate);
  });

  totalPages = computed(() => {
    return Math.ceil(this.totalItems() / this.itemsPerPage);
  });

  displayInfo = computed(() => {
    const page = this.currentPage();
    const total = this.totalItems();
    const itemsPerPage = this.itemsPerPage;
    const start = (page - 1) * itemsPerPage + 1;
    const end = Math.min(page * itemsPerPage, total);
    return { start, end, total, page };
  });

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadWalletData();
  }

  ngAfterViewInit(): void {
    // Check if need to auto-open deposit modal (from payment-cancel retry)
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state?.['openDepositModal']) {
      setTimeout(() => {
        this.openDepositModal();
      }, 300);
    }

    // Load external JS scripts
    if (typeof document === 'undefined') return;
    if (document.querySelector('script#food-main-js')) return;

    const script = document.createElement('script');
    script.id = 'food-main-js';
    script.src = 'assets/js/main.js';
    document.body.appendChild(script);
  }

  loadWalletData(): void {
    this.isLoading.set(true);
    
    // Load wallet balance and transactions in parallel
    this.walletSvc.getWallet().subscribe({
      next: (response) => {
        this.walletBalance.set(response.data.balance);
      },
      error: (err: any) => {
        console.error('Failed to load wallet balance:', err);
        // Handle 401 Unauthorized - redirect to login
        if (err.status === 401) {
          this.authSvc.logout();
          this.router.navigate(['/login']);
          return;
        }
        // Keep default value on error
        this.walletBalance.set(0);
      }
    });

    this.walletSvc.getTransactions(this.currentPage(), this.itemsPerPage).subscribe({
      next: (response) => {
        this.transactions.set(response.data);
        if (response.pagination) {
          this.totalItems.set(response.pagination.total);
        }
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load transactions:', err);
        // Handle 401 Unauthorized - redirect to login
        if (err.status === 401) {
          this.authSvc.logout();
          this.router.navigate(['/login']);
          return;
        }
        this.transactions.set([]);
        this.isLoading.set(false);
      }
    });
  }

  openDepositModal(): void {
    this.depositModal?.open();
  }

  setTimeFilter(days: '7' | '30' | 'all'): void {
    this.selectedTimeFilter.set(days);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.isLoading.set(true);
    this.loadWalletData();
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  getTransactionTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'deposit': 'Nạp tiền',
      'payment': 'Thanh toán đơn',
      'refund': 'Hoàn tiền',
      'bonus': 'Thưởng'
    };
    return labels[type] || type;
  }

  getTransactionBadgeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'deposit': 'bg-green-100 text-green-700',
      'payment': 'bg-red-100 text-red-600',
      'refund': 'bg-brand/10 text-brand',
      'bonus': 'bg-brand/10 text-brand'
    };
    return classes[type] || 'bg-gray-100 text-gray-700';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

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
}

