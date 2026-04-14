import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminMembershipService, MembershipPlan } from '../../../services/admin-membership.service';

@Component({
  selector: 'app-admin-memberships',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './memberships.html',
})
export class AdminMemberships implements OnInit {
  private readonly membershipService = inject(AdminMembershipService);

  plans: MembershipPlan[] = [];
  
  newPlan: MembershipPlan = {
    name: '',
    min_points: 0,
    discount_rate: 0,
    benefits: ''
  };

  isEditing: boolean = false;
  editingId: number | null = null;

  ngOnInit() {
    this.loadPlans();
  }

  loadPlans() {
    this.membershipService.getAllPlans().subscribe({
      next: (res: any) => this.plans = res.data || [],
      error: (err: any) => console.error('Lỗi tải danh sách thẻ thành viên:', err)
    });
  }

  onSubmit() {
    if (!this.newPlan.name || this.newPlan.min_points < 0 || this.newPlan.discount_rate < 0) {
      alert('Vui lòng nhập tên, điểm tối thiểu và % giảm giá hợp lệ!');
      return;
    }

    if (this.isEditing && this.editingId) {
      this.membershipService.updatePlan(this.editingId, this.newPlan).subscribe({
        next: () => {
          alert('Cập nhật hạng thành viên thành công!');
          this.resetForm();
          this.loadPlans();
        },
        error: (err: any) => alert(err.error?.message || 'Lỗi cập nhật')
      });
    } else {
      this.membershipService.createPlan(this.newPlan).subscribe({
        next: () => {
          alert('Tạo thẻ thành viên mới thành công!');
          this.resetForm();
          this.loadPlans();
        },
        error: (err: any) => alert(err.error?.message || 'Lỗi tạo mới')
      });
    }
  }

  editPlan(plan: MembershipPlan) {
    this.isEditing = true;
    this.editingId = plan.id!;
    this.newPlan = { ...plan }; // clone data
  }

  deletePlan(id?: number) {
    if (!id || !confirm('Cảnh báo: Xoá gói Rank này có thể ảnh hưởng đến quyền lợi người dùng hiện tại! Xác nhận xoá?')) return;

    this.membershipService.deletePlan(id).subscribe({
      next: () => {
        alert('Đã xoá cấp bậc hội viên!');
        this.loadPlans();
        if (this.editingId === id) this.resetForm();
      },
      error: (err: any) => alert(err.error?.message || 'Lỗi xoá cấp bậc')
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
