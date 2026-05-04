import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { AdminLayout } from '../shared/admin-layout/admin-layout';
import { AuthService } from '../../app/services/auth.service';
import { ProductService } from '../../app/services/product.service';
import { UserRecord, UserService } from '../../app/services/user.service';
import { OrderRecord, OrderService } from '../../app/services/order.service';

interface DashboardStat {
  label: string;
  value: string;
  trend: string;
  icon: string;
  tone: 'purple' | 'blue' | 'orange' | 'red';
}

interface PendingOrderView {
  customerName: string;
  customerAvatar: string;
  productName: string;
  date: string;
  amount: string;
  status: string;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, AdminLayout],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {
  private readonly authService = inject(AuthService);
  private readonly productService = inject(ProductService);
  private readonly userService = inject(UserService);
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUser = this.authService.getCurrentUser();
  readonly loading = signal(true);
  readonly error = signal('');
  readonly users = signal<UserRecord[]>([]);
  readonly orders = signal<OrderRecord[]>([]);
  readonly productTotal = signal(0);

  readonly totalRevenue = computed(() =>
    this.orders().reduce((sum, order) => sum + (order.total ?? 0), 0),
  );

  readonly pendingOrders = computed<PendingOrderView[]>(() =>
    this.orders()
      .filter((order) => order.status === 'pending' || order.status === 'processing')
      .slice(0, 10)
      .map((order) => ({
        customerName: order.shippingAddress?.name || order.user?.name || 'Khách hàng',
        customerAvatar:
          order.user?.avatar ||
          `https://ui-avatars.com/api/?background=0E3746&color=fff&name=${encodeURIComponent(order.shippingAddress?.name || order.user?.name || 'Khach Hang')}&size=30`,
        productName: order.items[0]?.name || order.items[0]?.product?.name || 'Không có sản phẩm',
        date: this.formatDate(order.createdAt),
        amount: this.formatCurrency(order.total),
        status: order.status === 'pending' ? 'Chờ duyệt' : 'Đang xử lý',
      })),
  );

  readonly quickStats = computed<DashboardStat[]>(() => {
    const cancelledCount = this.orders().filter((order) => order.status === 'cancelled').length;

    return [
      {
        label: 'Tổng doanh thu',
        value: this.formatCurrency(this.totalRevenue()),
        trend: 'Dữ liệu thời gian thực',
        icon: 'bx-dollar',
        tone: 'purple',
      },
      {
        label: 'Đơn hàng mới',
        value: String(this.orders().length),
        trend: 'Cập nhật từ MongoDB',
        icon: 'bx-shopping-bag',
        tone: 'blue',
      },
      {
        label: 'Khách hàng',
        value: String(this.users().length),
        trend: 'Tổng tài khoản hiện có',
        icon: 'bx-user',
        tone: 'orange',
      },
      {
        label: 'Đơn đã hủy',
        value: String(cancelledCount),
        trend: cancelledCount === 0 ? 'Không có đơn hủy' : 'Cần theo dõi',
        icon: 'bx-error-circle',
        tone: 'red',
      },
    ];
  });

  constructor() {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    this.error.set('');

    forkJoin({
      users: this.userService.getUsers(),
      products: this.productService.getProducts({ page: 1, limit: 1, includeInactive: true }),
      orders: this.orderService.getOrders({ page: 1, limit: 200 }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ users, products, orders }) => {
          this.users.set(users.data ?? []);
          this.productTotal.set(products.pagination?.total ?? products.data?.length ?? 0);
          this.orders.set(orders.data ?? []);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(this.resolveErrorMessage(error));
          this.loading.set(false);
        },
      });
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private formatDate(value?: string): string {
    if (!value) {
      return '--';
    }

    return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
  }

  private resolveErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseError = error as { error?: { message?: string } };
      if (typeof responseError.error?.message === 'string') {
        return responseError.error.message;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Không thể tải dữ liệu dashboard từ MongoDB.';
  }
}
