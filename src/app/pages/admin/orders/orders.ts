import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminOrderService } from '../../../services/admin-order.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
})
export class AdminOrders implements OnInit {
  private readonly adminOrderService = inject(AdminOrderService);

  orders: any[] = [];
  filteredOrders: any[] = [];
  searchQuery: string = '';

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders() {
    this.adminOrderService.getAllOrders().subscribe({
      next: (res: any) => {
        this.orders = res.data;
        this.applySearch();
      },
      error: (err: any) => {
        console.error('Lỗi khi tải danh sách đơn hàng', err);
        alert(err.error?.message || 'Không thể lấy danh sách đơn hàng. Bạn đã đăng nhập Admin chưa?');
      }
    });
  }

  applySearch() {
    if (!this.searchQuery.trim()) {
      this.filteredOrders = [...this.orders];
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredOrders = this.orders.filter(order => 
      order.order_code?.toLowerCase().includes(q) ||
      order.user?.full_name?.toLowerCase().includes(q)
    );
  }

  updateStatus(order: any, newStatus: string) {
    if (!confirm(`Bạn có chắc muốn chuyển trạng thái đơn ${order.order_code} thành: ${newStatus}?`)) {
      return;
    }
    
    this.adminOrderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: () => {
        alert('Cập nhật trạng thái thành công!');
        this.loadOrders();
      },
      error: (err: any) => alert(err.error?.message || 'Lỗi khi cập nhật trạng thái')
    });
  }
}
