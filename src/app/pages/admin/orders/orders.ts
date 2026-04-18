import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminOrderService } from '../../../services/admin-order.service';
import { DeleteModalComponent } from '../../../components/delete-modal/delete-modal.component';
import { ToastService } from '../../../components/toast/toast.service';

import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, DeleteModalComponent],
  templateUrl: './orders.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminOrders implements OnInit {
  private readonly adminOrderService = inject(AdminOrderService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastSvc = inject(ToastService);
  readonly orders = signal<any[]>([]);
  readonly searchQuery = signal<string>('');
  
  readonly filteredOrders = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.orders();
    
    return this.orders().filter(order => {
      const codeMatches = order.order_code ? order.order_code.toLowerCase().includes(query) : false;
      const nameMatches = order.user?.full_name ? order.user.full_name.toLowerCase().includes(query) : false;
      return codeMatches || nameMatches;
    });
  });

  readonly selectedOrder = signal<any | null>(null);
  readonly isModalOpen = signal<boolean>(false);
  readonly showStatusUpdateModal = signal(false);
  readonly statusUpdateOrder = signal<any | null>(null);
  readonly statusUpdateToValue = signal<string>('');
  readonly updatingOrderStatus = signal(false);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadOrders();
    }
  }

  loadOrders() {
    this.adminOrderService.getAllOrders().subscribe({
      next: (res: any[]) => this.orders.set(res),
      error: (err: any) => {
        console.error('Lỗi khi tải danh sách đơn hàng:', err);
        if (typeof window !== 'undefined') {
          this.toastSvc.error(err.error?.message || 'Không thể lấy danh sách đơn hàng. Bạn đã đăng nhập Admin chưa?');
        }
      }
    });
  }

  openModal(order: any) {
    this.selectedOrder.set(order);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedOrder.set(null);
  }

  openStatusUpdateModal(newStatus: string) {
    const order = this.selectedOrder();
    if (!order) return;
    
    this.statusUpdateOrder.set(order);
    this.statusUpdateToValue.set(newStatus);
    this.showStatusUpdateModal.set(true);
  }

  confirmStatusUpdate() {
    const order = this.statusUpdateOrder();
    const newStatus = this.statusUpdateToValue();
    
    if (!order || !newStatus) return;

    this.showStatusUpdateModal.set(false);
    this.updatingOrderStatus.set(true);

    const statusLabel = this.getStatusLabel(newStatus);

    this.adminOrderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: () => {
        order.status = newStatus;
        this.toastSvc.success(`Cập nhật trạng thái thành: ${statusLabel}`);
        this.updatingOrderStatus.set(false);
        this.loadOrders();
      },
      error: (err: any) => {
        this.toastSvc.error(err.error?.message || 'Không thể cập nhật trạng thái đơn hàng.');
        this.updatingOrderStatus.set(false);
      }
    });

    this.statusUpdateOrder.set(null);
    this.statusUpdateToValue.set('');
  }

  cancelStatusUpdate() {
    this.showStatusUpdateModal.set(false);
    this.statusUpdateOrder.set(null);
    this.statusUpdateToValue.set('');
  }

  private getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Chờ xác nhận',
      'preparing': 'Đang chuẩn bị',
      'delivering': 'Đang giao hàng',
      'delivered': 'Đã giao',
      'cancelled': 'Đã huỷ'
    };
    return labels[status] || status;
  }

  updateStatus(newStatus: string) {
    this.openStatusUpdateModal(newStatus);
  }
}
