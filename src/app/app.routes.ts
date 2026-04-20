import { Routes } from '@angular/router';
import { ClientLayout } from './layouts/client/client';
import { adminChildGuard, adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'admin',
    canActivate: [adminGuard],
    canActivateChild: [adminChildGuard],
    loadComponent: () => import('./layouts/admin/admin').then(m => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admin/dashboard/dashboard').then(m => m.AdminDashboard),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/admin/orders/orders').then(m => m.AdminOrders),
      },
      {
        path: 'promotions',
        loadComponent: () =>
          import('./pages/admin/promotions/promotions').then(m => m.AdminPromotions),
      },
      {
        path: 'memberships',
        loadComponent: () =>
          import('./pages/admin/memberships/memberships').then(m => m.AdminMemberships),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/admin/users/list').then(m => m.AdminUsersList),
      },
      {
        path: 'forms',
        loadComponent: () =>
          import('./pages/admin/form-samples/form-samples').then(m => m.AdminFormSamples),
      },
      {
        path: 'tables',
        loadComponent: () =>
          import('./pages/admin/table-samples/table-samples').then(m => m.AdminTableSamples),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/admin/categories/list').then(m => m.AdminCategoriesList),
      },
      {
        path: 'categories/create',
        loadComponent: () =>
          import('./pages/admin/categories/create').then(m => m.AdminCategoriesCreate),
      },
      {
        path: 'categories/edit/:id',
        loadComponent: () =>
          import('./pages/admin/categories/edit').then(m => m.AdminCategoriesEdit),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/admin/products/list').then(m => m.AdminProductsList),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./pages/admin/messages/messages').then(m => m.AdminMessages),
      },
    ],
  },
  {
    path: '',
    component: ClientLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/client/home/home').then(m => m.Home),
      },
      {
        path: 'help',
        loadComponent: () => import('./pages/client/help/help').then(m => m.Help),
      },
      {
        path: 'wallet',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/client/wallet/wallet').then(m => m.Wallet),
      },
      {
        path: 'account',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/client/account/account').then(m => m.Account),
      },
      {
        path: 'payment',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/client/payment/payment').then(m => m.PaymentComponent),
      },
      {
        path: 'payment/callback',
        loadComponent: () => import('./pages/client/payment/payment-callback/payment-callback.component').then(m => m.PaymentCallbackComponent),
      },
      {
        path: 'payment/success',
        loadComponent: () => import('./pages/client/payment/payment-success/payment-success.component').then(m => m.PaymentSuccessComponent),
      },
      {
        path: 'payment/cancel',
        loadComponent: () => import('./pages/client/payment/payment-cancel/payment-cancel.component').then(m => m.PaymentCancelComponent),
      },
      {
        path: 'product/:id',
        loadComponent: () => import('./pages/client/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
      },
      {
        path: 'orders',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/client/orders/orders').then(m => m.Orders),
      },
      {
        path: 'messages',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/client/messages/messages').then(m => m.Messages),
      },
      {
        path: 'favorites',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/client/favorites/favorites').then(m => m.Favorites),
      },
      {
        path: 'upgrade',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/client/upgrade/upgrade').then(m => m.Upgrade),
      },
      {
        path: 'upgrade-success',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/client/upgrade-success/upgrade-success').then(m => m.UpgradeSuccess),
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/client/login/login').then(m => m.Login),
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/client/register/register').then(m => m.Register),
      }
    ],
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('./not-found/not-found.component').then(m => m.NotFoundComponent),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];