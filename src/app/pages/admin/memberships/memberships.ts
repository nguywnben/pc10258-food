import { Component, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminMembershipService, MembershipPlan } from '../../../services/admin-membership.service';

import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-admin-memberships',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './memberships.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminMemberships implements OnInit {
  private readonly membershipService = inject(AdminMembershipService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly plans = signal<MembershipPlan[]>([]);
  
  newPlan: MembershipPlan = {
    name: '',
    min_points: 0,
    discount_rate: 0,
    benefits: ''
  };

  isEditing: boolean = false;
  editingId: number | null = null;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadPlans();
    }
  }

  loadPlans() {
    this.membershipService.getAllPlans().subscribe({
      next: (res: MembershipPlan[]) => this.plans.set(res || []),
      error: (err: any) => {
        console.error('Lỗi tải danh sách thẻ thành viên:', err);
        if (typeof window !== 'undefined') {
          alert(err.error?.message || 'Lỗi tải danh sách thẻ thành viên');
        }
      }
    });
  }

  onSubmit() {
    if (!this.newPlan.name || this.newPlan.min_points < 0 || this.newPlan.discount_rate < 0) {
      alert('Vui lòng kiểm tra lại thông tin form!');
      return;
    }

    if (this.isEditing && this.editingId) {
      this.membershipService.updatePlan(this.editingId, this.newPlan).subscribe({
        next: () => {
          alert('Cập nhật rank thành công!');
          this.resetForm();
          this.loadPlans();
        },
        error: (err: any) => alert(err.error?.message || 'Lỗi cập nhật')
      });
    } else {
      this.membershipService.createPlan(this.newPlan).subscribe({
        next: () => {
          alert('Tạo rank thành công!');
          this.resetForm();
          this.loadPlans();
        },
        error: (err: any) => alert(err.error?.message || 'Lỗi tạo rank mới')
      });
    }
  }

  editPlan(plan: MembershipPlan) {
    this.isEditing = true;
    this.editingId = plan.id!;
    this.newPlan = { ...plan };
  }

  deletePlan(id?: number) {
    if (!id || !confirm('Xoá rank này?')) return;
    
    this.membershipService.deletePlan(id).subscribe({
      next: () => {
        this.plans.update(items => items.filter(p => p.id !== id));
        alert('Đã xoá!');
      },
      error: (err: any) => alert(err.error?.message || 'Lỗi xoá rank')
    });
  }

  resetForm() {
    this.isEditing = false;
    this.editingId = null;
    this.newPlan = {
      name: '',
      min_points: 0,
      discount_rate: 0,
      benefits: ''
    };
  }
}
