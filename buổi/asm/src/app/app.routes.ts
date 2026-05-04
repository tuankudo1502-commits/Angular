import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';
import { userGuard, userMatchGuard } from './guards/user.guard';
import { productsResolver } from './product-list/product-list.resolver';
import { homeProductsResolver } from './home/home.resolver';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canMatch: [userMatchGuard],
    loadComponent: () => import('./home/home').then((m) => m.Home),
    resolve: { products: homeProductsResolver },
  },
  {
    path: 'products',
    canMatch: [userMatchGuard],
    loadComponent: () => import('./product-list/product-list').then((m) => m.ProductList),
    resolve: { products: productsResolver },
  },
  {
    path: 'product/:name',
    canMatch: [userMatchGuard],
    loadComponent: () => import('./product-detail/product-detail').then((m) => m.ProductDetail),
  },
  {
    path: 'cart',
    canActivate: [authGuard, userGuard],
    loadComponent: () => import('./cart/cart').then((m) => m.Cart),
  },
  {
    path: 'about',
    canMatch: [userMatchGuard],
    loadComponent: () => import('./about/about').then((m) => m.About),
  },
  {
    path: 'contact',
    canMatch: [userMatchGuard],
    loadComponent: () => import('./contact/contact').then((m) => m.Contact),
  },
  {
    path: 'login',
    canMatch: [userMatchGuard],
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    canMatch: [userMatchGuard],
    loadComponent: () => import('./register/register').then((m) => m.Register),
  },
  {
    path: 'profile',
    canActivate: [authGuard, userGuard],
    loadComponent: () => import('./profile/profile').then((m) => m.Profile),
  },
  {
    path: 'orders',
    canActivate: [authGuard, userGuard],
    loadComponent: () => import('./orders/orders').then((m) => m.Orders),
  },
  {
    path: 'admin',
    canMatch: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../admin/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('../admin/admin-categories/admin-categories').then((m) => m.AdminCategories),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('../admin/admin-products/admin-products').then((m) => m.AdminProducts),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('../admin/admin-orders/admin-orders').then((m) => m.AdminOrders),
      },
      {
        path: 'users',
        loadComponent: () => import('../admin/admin-users/admin-users').then((m) => m.AdminUsers),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
