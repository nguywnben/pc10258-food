import { Component, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminOrderService } from '../../../services/admin-order.service';
import { ProductsService, Product } from '../../../services/products.service';
import { UsersService, User } from '../../../services/users.service';
import { signal } from '@angular/core';

interface Order {
  id: number;
  user_id: number;
  order_code: string;
  status: 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  newUsers: number;
  topProduct: Product | null;
  ordersByStatus: Record<string, number>;
  recentOrders: Order[];
  topProducts: Product[];
  categoryBreakdown: Record<string, { count: number; revenue: number }>;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
})
export class AdminDashboard {
  private readonly adminOrderSvc = inject(AdminOrderService);
  private readonly productsSvc = inject(ProductsService);
  private readonly usersSvc = inject(UsersService);

  // Signals
  orders = signal<Order[]>([]);
  products = signal<Product[]>([]);
  users = signal<User[]>([]);
  isLoading = signal(true);

  // Computed stats
  stats = computed<DashboardStats>(() => {
    const ordersList = this.orders();
    const productsList = this.products();
    const usersList = this.users();

    // Total revenue (tổng tiền của all delivered orders)
    const totalRevenue = ordersList
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0);

    // Total orders
    const totalOrders = ordersList.length;

    // New users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsers = usersList.filter(u => {
      if (!u.created_at) return false;
      const createdDate = new Date(u.created_at);
      createdDate.setHours(0, 0, 0, 0);
      return createdDate.getTime() === today.getTime();
    }).length;

    // Top product by review_count
    const topProduct = productsList.length > 0 
      ? productsList.reduce((max, p) => (p.review_count > (max?.review_count || 0) ? p : max), productsList[0])
      : null;

    // Orders by status
    const ordersByStatus: Record<string, number> = {};
    ordersList.forEach(o => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    });

    // Recent orders (last 5)
    const recentOrders = ordersList.slice(0, 5);

    // Top 5 products by review_count
    const topProducts = productsList
      .sort((a, b) => b.review_count - a.review_count)
      .slice(0, 5);

    // Category breakdown (by product count and simulated revenue)
    const categoryBreakdown: Record<string, { count: number; revenue: number }> = {};
    productsList.forEach(p => {
      const category = `cat_${p.category_id}`;
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { count: 0, revenue: 0 };
      }
      categoryBreakdown[category].count += 1;
      categoryBreakdown[category].revenue += p.price;
    });

    return {
      totalRevenue,
      totalOrders,
      newUsers,
      topProduct,
      ordersByStatus,
      recentOrders,
      topProducts,
      categoryBreakdown,
    };
  });

  // Growth indicators (comparison with previous period - simulated)
  revenueGrowth = computed(() => Math.floor(Math.random() * 20) + 5);
  orderGrowth = computed(() => Math.floor(Math.random() * 15) + 3);
  userGrowth = computed(() => Math.floor(Math.random() * 10) + 1);
  topProductReviewPercent = computed(() => {
    const stats = this.stats();
    return stats.topProduct ? Math.round((stats.topProduct.review_count / 50) * 100) : 0;
  });

  constructor() {
    effect(() => {
      this.loadDashboardData();
    });
  }

  loadDashboardData(): void {
    this.isLoading.set(true);

    Promise.all([
      this.adminOrderSvc.getAllOrders().toPromise(),
      this.productsSvc.getAll(true).toPromise(),
      this.usersSvc.getAll().toPromise(),
    ]).then(([ordersData, productsData, usersData]) => {
      this.orders.set(ordersData || []);
      this.products.set(productsData || []);
      this.users.set(usersData || []);
      this.isLoading.set(false);
    }).catch(error => {
      console.error('Error loading dashboard data:', error);
      this.isLoading.set(false);
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'badge-info',
      'preparing': 'badge-warning',
      'delivering': 'badge-warning',
      'delivered': 'badge-success',
      'cancelled': 'badge-danger',
    };
    return statusMap[status] || 'badge-info';
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Chờ xác nhận',
      'preparing': 'Đang nấu',
      'delivering': 'Đang giao',
      'delivered': 'Hoàn thành',
      'cancelled': 'Đã huỷ',
    };
    return statusMap[status] || status;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN');
  }

  getUserInitials(user: any): string {
    if (!user) return 'U';
    const name = user.full_name || user.name || 'User';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getRandomColor(): string {
    const colors = [
      'bg-brand/10 text-brand',
      'bg-blue-50 text-blue-500',
      'bg-emerald-50 text-emerald-500',
      'bg-amber-50 text-amber-500',
      'bg-purple-50 text-purple-500',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
