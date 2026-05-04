import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrderRecord, OrderService } from '../../app/services/order.service';
import { AdminLayout } from '../shared/admin-layout/admin-layout';

@Component({
  selector: 'app-admin-orders',
  imports: [AdminLayout],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrders {
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<OrderRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly searchTerm = signal('');
  readonly statusFilter = signal<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');

  readonly filteredOrders = computed(() => {
    const keyword = this.searchTerm().trim().toLowerCase();
    const selectedStatus = this.statusFilter();

    return this.orders().filter((order) => {
      const customerName = this.resolveCustomerName(order).toLowerCase();
      const firstItem = this.resolvePrimaryItem(order).toLowerCase();
      const orderCode = this.getOrderCode(order).toLowerCase();
      const matchesSearch = !keyword || [customerName, firstItem, orderCode].join(' ').includes(keyword);
      const matchesStatus = selectedStatus === 'all' ? true : order.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  });

  constructor() {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.error.set('');

    this.orderService
      .getOrders({ page: 1, limit: 300 })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.orders.set(response.data ?? []);
        },
        error: (error: unknown) => {
          this.error.set(this.resolveErrorMessage(error));
        },
      });
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onStatusFilterInput(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.statusFilter.set(
      value as 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
    );
  }

  getOrderCode(order: OrderRecord): string {
    return `#OD-${order._id.slice(-6).toUpperCase()}`;
  }

  resolveCustomerName(order: OrderRecord): string {
    return order.shippingAddress?.name || order.user?.name || 'Khách hàng';
  }

  resolveCustomerAvatar(order: OrderRecord): string {
    if (order.user?.avatar) {
      return order.user.avatar;
    }

    const name = this.resolveCustomerName(order);
    return `https://ui-avatars.com/api/?background=0E3746&color=fff&name=${encodeURIComponent(name)}&size=35`;
  }

  resolvePrimaryItem(order: OrderRecord): string {
    const firstItem = order.items[0];
    return firstItem?.name || firstItem?.product?.name || 'Không có sản phẩm';
  }

  getPaymentClass(order: OrderRecord): string {
    if (order.paymentStatus === 'paid') {
      return 'paid';
    }

    if (order.paymentStatus === 'failed') {
      return 'failed';
    }

    return 'pending';
  }

  getPaymentLabel(order: OrderRecord): string {
    if (order.paymentStatus === 'paid') {
      return 'Đã thanh toán';
    }

    if (order.paymentStatus === 'failed') {
      return 'Thanh toán lỗi';
    }

    return order.paymentMethod.toUpperCase();
  }

  getStatusLabel(status: OrderRecord['status']): string {
    const map: Record<OrderRecord['status'], string> = {
      pending: 'Chờ duyệt',
      processing: 'Đang xử lý',
      shipped: 'Đang giao',
      delivered: 'Hoàn tất',
      cancelled: 'Đã hủy',
    };

    return map[status];
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
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

    return 'Không thể tải đơn hàng. Vui lòng thử lại.';
  }
}
