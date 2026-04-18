import { DecimalPipe, DatePipe, NgClass, NgFor, NgIf, CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService, Order } from '../../../services/order.service';
import { PaymentService } from '../../../services/payment.service';
import { ToastService } from '../../../components/toast/toast.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.html',
})
export class Orders implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly paymentService = inject(PaymentService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  resumingOrderId = signal<number | null>(null);

  orders = signal<Order[]>([]);
  loading = signal(true);
  currentFilter = signal<string>('all');
  selectedOrder = signal<Order | null>(null);
  showDetailModal = signal(false);

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

  openDetailModal(order: Order): void {
    this.selectedOrder.set(order);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedOrder.set(null);
  }

  payOrder(order: Order): void {
    if (this.resumingOrderId() !== null) return;
    this.resumingOrderId.set(order.id);

    this.paymentService.getActiveForOrder(order.id).subscribe({
      next: (res) => {
        const data = res.data;
        if (data.active && data.checkout_url) {
          // Đã có link PayOS còn hiệu lực -> mở thẳng
          window.location.href = data.checkout_url;
          return;
        }
        this.resumingOrderId.set(null);
        this.goToPaymentPage(order);
      },
      error: (err) => {
        console.warn('Không kiểm tra được active payment, mở trang /payment:', err);
        this.resumingOrderId.set(null);
        this.goToPaymentPage(order);
      }
    });
  }

  private goToPaymentPage(order: Order): void {
    this.router.navigate(['/payment'], {
      state: {
        type: 'order',
        amount: order.total,
        order_id: order.id
      },
      queryParams: {
        type: 'order',
        amount: order.total,
        order_id: order.id,
        label: `Thanh toán hoá đơn ${order.order_code}`
      }
    });
  }

  cancelOrder(orderId: number): void {
    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      this.orderService.cancelOrder(orderId).subscribe({
        next: () => {
          this.toast.success('Hủy đơn hàng thành công');
          this.loadOrders(this.currentFilter() === 'all' ? undefined : this.currentFilter());
        },
        error: (err) => {
          this.toast.error('Không thể hủy đơn hàng: ' + (err.error?.message || 'Lỗi hệ thống'));
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

