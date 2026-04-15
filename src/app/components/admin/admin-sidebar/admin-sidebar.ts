import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.html',
})
export class AdminSidebar {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/']);
  }
}
