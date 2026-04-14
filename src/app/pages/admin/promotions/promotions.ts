import { Component, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminPromotionService, Promotion } from '../../../services/admin-promotion.service';

import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-admin-promotions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './promotions.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminPromotions implements OnInit {
  private readonly promoService = inject(AdminPromotionService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly promotions = signal<Promotion[]>([]);
  
  // Model for the create form
  newPromo: Promotion = {
    code: '',
    discount_type: 'percent',
    discount_value: 0,
    min_order_value: 0,
    max_uses: 100,
    start_date: '',
    end_date: '',
    description: '',
    is_active: true
  };

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadPromotions();
    }
  }

  loadPromotions() {
    this.promoService.getAllPromotions().subscribe({
      next: (res: Promotion[]) => this.promotions.set(res || []),
      error: (err: any) => {
        console.error('Lỗi tải danh sách khuyến mãi:', err);
        if (typeof window !== 'undefined') {
          alert(err.error?.message || 'Lỗi tải danh sách khuyến mãi');
        }
      }
    });
  }

  onSubmit() {
    if (!this.newPromo.code || this.newPromo.discount_value <= 0) {
      alert('Vui lòng nhập mã và giá trị giảm hợp lệ!');
      return;
    }

    // Default to active for new promos
    this.newPromo.is_active = true;

    this.promoService.createPromotion(this.newPromo).subscribe({
      next: () => {
        alert('Tạo mã khuyến mãi thành công!');
        this.resetForm();
        this.loadPromotions();
      },
      error: (err: any) => alert(err.error?.message || 'Lỗi tạo mã khuyến mãi')
    });
  }

  toggleStatus(promo: Promotion) {
    if (!promo.id) return;
    const updatedStatus = !promo.is_active;
    if (!confirm(`Bạn muốn ${updatedStatus ? 'MỞ' : 'TẮT'} mã ${promo.code}?`)) return;

    this.promoService.updatePromotion(promo.id, { is_active: updatedStatus }).subscribe({
      next: () => {
        // Update specific item in the signal array
        this.promotions.update(promos => 
          promos.map(p => p.id === promo.id ? { ...p, is_active: updatedStatus } : p)
        );
        alert('Cập nhật trạng thái thành công!');
      },
      error: (err: any) => alert(err.error?.message || 'Có lỗi xảy ra')
    });
  }

  deletePromo(id?: number) {
    if (!id || !confirm('Xoá mã khuyến mãi này? Hệ thống không thể hoàn tác!')) return;

    this.promoService.deletePromotion(id).subscribe({
      next: () => {
        alert('Đã xoá mã!');
        this.promotions.update(promos => promos.filter(p => p.id !== id));
      },
      error: (err: any) => alert(err.error?.message || 'Lỗi xoá mã')
    });
  }

  resetForm() {
    this.newPromo = {
      code: '',
      discount_type: 'percent',
      discount_value: 0,
      min_order_value: 0,
      max_uses: 100,
      start_date: '',
      end_date: '',
      description: '',
      is_active: true
    };
  }
}
