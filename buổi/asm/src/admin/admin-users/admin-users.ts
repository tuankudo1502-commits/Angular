import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserRecord, UserService } from '../../app/services/user.service';
import { AdminLayout } from '../shared/admin-layout/admin-layout';

@Component({
  selector: 'app-admin-users',
  imports: [AdminLayout],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsers {
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  readonly users = signal<UserRecord[]>([]);
  readonly loading = signal(true);
  readonly updating = signal(false);
  readonly error = signal('');
  readonly searchTerm = signal('');
  readonly roleFilter = signal<'all' | 'admin' | 'user'>('all');

  readonly filteredUsers = computed(() => {
    const keyword = this.searchTerm().trim().toLowerCase();
    const role = this.roleFilter();

    return this.users().filter((user) => {
      const matchedRole = role === 'all' ? true : user.role === role;
      const matchedSearch =
        !keyword ||
        [user.name, user.email, user.phone ?? ''].join(' ').toLowerCase().includes(keyword);

      return matchedRole && matchedSearch;
    });
  });

  readonly totalUsers = computed(() => this.filteredUsers().length);

  constructor() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set('');

    this.userService
      .getUsers()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.users.set(response.data ?? []);
        },
        error: (error: unknown) => {
          this.error.set(this.resolveErrorMessage(error));
        },
      });
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onRoleFilterInput(event: Event): void {
    this.roleFilter.set((event.target as HTMLSelectElement).value as 'all' | 'admin' | 'user');
  }

  toggleUserActive(user: UserRecord): void {
    this.updating.set(true);
    this.error.set('');

    this.userService
      .updateUser(user._id, { isActive: !user.isActive })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.updating.set(false)),
      )
      .subscribe({
        next: () => {
          this.users.update((users) =>
            users.map((item) =>
              item._id === user._id ? { ...item, isActive: !item.isActive } : item,
            ),
          );
        },
        error: (error: unknown) => {
          this.error.set(this.resolveErrorMessage(error));
        },
      });
  }

  getAvatar(user: UserRecord): string {
    if (user.avatar) {
      return user.avatar;
    }

    return `https://ui-avatars.com/api/?background=0E3746&color=fff&name=${encodeURIComponent(user.name)}&size=35`;
  }

  getRoleLabel(role: UserRecord['role']): string {
    return role === 'admin' ? 'Admin' : 'Customer';
  }

  formatDate(value: string): string {
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

    return 'Không thể tải danh sách người dùng. Vui lòng thử lại.';
  }
}
