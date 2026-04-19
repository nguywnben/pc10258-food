import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminHeader } from '../../components/admin/admin-header/admin-header';
import { AdminSidebar } from '../../components/admin/admin-sidebar/admin-sidebar';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebar, AdminHeader],
  templateUrl: './admin.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        min-height: 0;
        overflow: hidden;
      }
    `,
  ],
})
export class AdminLayout {}
