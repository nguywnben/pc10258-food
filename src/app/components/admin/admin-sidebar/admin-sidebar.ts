import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.html',
})
export class AdminSidebar {
  private readonly router = inject(Router);

  logout(): void {
    void this.router.navigate(['/login']);
  }
}
