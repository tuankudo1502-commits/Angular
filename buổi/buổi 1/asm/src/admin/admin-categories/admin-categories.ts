import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Category, CategoryPayload, CategoryService } from '../../app/services/category.service';
import { AdminLayout } from '../shared/admin-layout/admin-layout';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AdminLayout],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCategories implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly searchTerm = signal('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  readonly selectedCategoryId = signal<string | null>(null);
  readonly formPanel = viewChild<ElementRef<HTMLElement>>('categoryFormPanel');

  readonly categoryForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required, Validators.minLength(8)]],
    image: ['', [Validators.required]],
    parentCategory: [''],
    isActive: [true],
  });

  readonly selectedCategory = computed(() => {
    const categoryId = this.selectedCategoryId();
    return this.categories().find((category) => category._id === categoryId) ?? null;
  });

  readonly filteredCategories = computed(() => {
    const searchTerm = this.searchTerm().trim().toLowerCase();
    const statusFilter = this.statusFilter();

    return this.categories().filter((category) => {
      const matchesSearch =
        !searchTerm ||
        [category.name, category.description ?? '']
          .join(' ')
          .toLowerCase()
          .includes(searchTerm);

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? category.isActive
            : !category.isActive;

      return matchesSearch && matchesStatus;
    });
  });

  readonly totalCategories = computed(() => this.categories().length);
  readonly activeCategories = computed(() => this.categories().filter((category) => category.isActive).length);
  readonly inactiveCategories = computed(() => this.totalCategories() - this.activeCategories());
  readonly totalProducts = computed(() =>
    this.categories().reduce((total, category) => total + (category.productCount ?? 0), 0),
  );
  readonly formTitle = computed(() =>
    this.selectedCategory() ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới',
  );
  readonly formDescription = computed(() =>
    this.selectedCategory()
      ? 'Cập nhật nội dung và trạng thái hiển thị của danh mục.'
      : 'Tạo nhanh một danh mục mới cho kho sản phẩm.',
  );
  readonly availableParentCategories = computed(() => {
    const selectedId = this.selectedCategoryId();
    return this.categories().filter((category) => category._id !== selectedId);
  });

  ngOnInit(): void {
    this.startCreate();
    this.loadCategories();
  }

  openCreateForm(): void {
    this.startCreate();

    queueMicrotask(() => {
      this.formPanel()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  loadCategories(): void {
    this.loading.set(true);
    this.error.set('');

    this.categoryService
      .getCategories()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response: { data?: Category[] }) => {
          this.categories.set(response.data ?? []);
        },
        error: (error) => {
          this.error.set(this.resolveErrorMessage(error));
        },
      });
  }

  startCreate(): void {
    this.selectedCategoryId.set(null);
    this.categoryForm.reset({
      name: '',
      description: '',
      image: '',
      parentCategory: '',
      isActive: true,
    });
  }

  startEdit(category: Category): void {
    this.selectedCategoryId.set(category._id);
    this.categoryForm.reset({
      name: category.name,
      description: category.description ?? '',
      image: category.image ?? '',
      parentCategory: this.extractParentCategoryId(category.parentCategory),
      isActive: category.isActive,
    });
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const formValue = this.categoryForm.getRawValue();
    const payload: CategoryPayload = {
      name: formValue.name.trim(),
      description: formValue.description.trim(),
      image: formValue.image.trim(),
      parentCategory: formValue.parentCategory.trim() || null,
      isActive: formValue.isActive,
    };

    const selectedCategoryId = this.selectedCategoryId();
    const request$ = selectedCategoryId
      ? this.categoryService.updateCategory(selectedCategoryId, payload)
      : this.categoryService.createCategory(payload);

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.success.set(selectedCategoryId ? 'Cập nhật danh mục thành công.' : 'Thêm danh mục thành công.');
          this.startCreate();
          this.loadCategories();
        },
        error: (error) => {
          this.error.set(this.resolveErrorMessage(error));
        },
      });
  }

  toggleCategoryVisibility(category: Category): void {
    const payload: CategoryPayload = {
      name: category.name,
      description: category.description ?? '',
      image: category.image ?? '',
      parentCategory: this.extractParentCategoryId(category.parentCategory),
      isActive: !category.isActive,
    };

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    this.categoryService
      .updateCategory(category._id, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.success.set(category.isActive ? 'Đã ẩn danh mục.' : 'Đã hiển thị lại danh mục.');
          this.loadCategories();
        },
        error: (error) => {
          this.error.set(this.resolveErrorMessage(error));
        },
      });
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onStatusFilterInput(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as 'all' | 'active' | 'inactive');
  }

  getParentCategoryName(parentCategory: Category['parentCategory']): string {
    if (!parentCategory) {
      return 'Danh mục gốc';
    }

    if (typeof parentCategory === 'string') {
      const resolvedParent = this.categories().find((category) => category._id === parentCategory);
      return resolvedParent?.name ?? 'Danh mục gốc';
    }

    return parentCategory.name;
  }

  private extractParentCategoryId(parentCategory: Category['parentCategory']): string {
    if (!parentCategory || typeof parentCategory === 'string') {
      return parentCategory ?? '';
    }

    return parentCategory._id;
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

    return 'Không thể xử lý danh mục lúc này. Vui lòng thử lại.';
  }

  getFieldError(fieldName: keyof typeof this.categoryForm.controls): string {
    const control = this.categoryForm.controls[fieldName];

    if (!control || !(control.touched || control.dirty) || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      const requiredMessages: Partial<Record<keyof typeof this.categoryForm.controls, string>> = {
        name: 'Tên danh mục là bắt buộc.',
        description: 'Mô tả danh mục là bắt buộc.',
        image: 'Ảnh đại diện là bắt buộc.',
      };

      return requiredMessages[fieldName] ?? 'Trường này là bắt buộc.';
    }

    if (control.errors['minlength']) {
      const minLengthMessages: Partial<Record<keyof typeof this.categoryForm.controls, string>> = {
        name: 'Tên danh mục phải có ít nhất 2 ký tự.',
        description: 'Mô tả phải có ít nhất 8 ký tự.',
      };

      return minLengthMessages[fieldName] ?? 'Giá trị nhập vào quá ngắn.';
    }

    return 'Dữ liệu không hợp lệ.';
  }
}
