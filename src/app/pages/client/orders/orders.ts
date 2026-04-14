import { DecimalPipe, DatePipe, NgClass, NgFor, NgIf, CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { OrderService, Order } from '../../../services/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.html',
})
export class Orders implements OnInit {
  private readonly orderService = inject(OrderService);

  orders = signal<Order[]>([]);
  loading = signal(true);
  currentFilter = signal<string>('all');

  ngOnInit(): void {
    this.loadOrders();
    this.initMainJs();
  }

  loadOrders(status?: string): void {
    this.loading.set(true);
    const filter = status === 'all' ? undefined : status;
    this.orderService.getOrders(filter).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.loading.set(false);
      }
    });
  }

  filterOrders(status: string): void {
    this.currentFilter.set(status);
    this.loadOrders(status);
  }

  cancelOrder(orderId: number): void {
    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      this.orderService.cancelOrder(orderId).subscribe({
        next: () => {
          alert('Hủy đơn hàng thành công');
          this.loadOrders(this.currentFilter() === 'all' ? undefined : this.currentFilter());
        },
        error: (err) => {
          alert('Không thể hủy đơn hàng: ' + (err.error?.message || 'Lỗi hệ thống'));
        }
      });
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Chờ xử lý',
      'preparing': 'Đang chuẩn bị',
      'delivering': 'Đang giao',
      'delivered': 'Đã giao',
      'cancelled': 'Đã hủy'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-700',
      'preparing': 'bg-blue-100 text-blue-700',
      'delivering': 'bg-blue-100 text-blue-700',
      'delivered': 'bg-green-100 text-green-700',
      'cancelled': 'bg-gray-200 text-ink-light'
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  }

  private initMainJs(): void {
    if (typeof document === 'undefined') return;
    if (document.querySelector('script#food-main-js')) return;

    const script = document.createElement('script');
    script.id = 'food-main-js';
    script.src = 'assets/js/main.js';
    document.body.appendChild(script);
  }
}

