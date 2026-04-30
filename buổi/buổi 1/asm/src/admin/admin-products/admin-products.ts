import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  viewChild,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Category, CategoryService } from '../../app/services/category.service';
import { ProductService } from '../../app/services/product.service';
import { Product } from '../../interfaces/product';
import { AdminLayout } from '../shared/admin-layout/admin-layout';

@Component({
  selector: 'app-admin-products',
  imports: [ReactiveFormsModule, AdminLayout],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProducts {
    readonly supportedGames = [
      'Valorant',
      'CS2',
      'CS:GO',
      'Delta Force',
      'PUBG',
      'Fortnite',
      'Call of Duty',
      'Apex Legends',
    ];

  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly searchTerm = signal('');
  readonly gameFilter = signal('all');
  readonly rarityFilter = signal('all');
  readonly selectedProductId = signal<string | null>(null);
  readonly formPanel = viewChild<ElementRef<HTMLElement>>('productFormPanel');

  readonly productForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    price: [0, [Validators.required, Validators.min(0)]],
    image: [''],
    mainImage: [''],
    subImage: [''],
    game: ['', [Validators.required]],
    rarity: ['Premium', [Validators.required]],
    stock: [0, [Validators.required, Validators.min(0)]],
    sales: [0, [Validators.required, Validators.min(0)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    category: [''],
    releaseDate: [''],
    isNew: [false],
    isLimited: [false],
    isActive: [true],
  });

  readonly selectedProduct = computed(() => {
    const selectedId = this.selectedProductId();
    return this.products().find((product) => product._id === selectedId) ?? null;
  });

  readonly formTitle = computed(() =>
    this.selectedProduct() ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới',
  );

  readonly formDescription = computed(() =>
    this.selectedProduct()
      ? 'Cập nhật thông tin, giá, hình ảnh hoặc trạng thái ẩn/hiện của sản phẩm.'
      : 'Nhập thông tin sản phẩm mới để thêm vào kho quản trị.',
  );

  readonly filteredProducts = computed(() => {
    const keyword = this.searchTerm().trim().toLowerCase();
    const selectedGame = this.gameFilter();
    const selectedRarity = this.rarityFilter();

    return this.products().filter((product) => {
      const matchesSearch =
        !keyword ||
        [product.name, this.resolveCategoryName(product.category), product.game ?? '']
          .join(' ')
          .toLowerCase()
          .includes(keyword);
      const matchesGame =
        selectedGame === 'all' ? true : (product.game ?? '').toLowerCase() === selectedGame;
      const matchesRarity =
        selectedRarity === 'all' ? true : (product.rarity ?? '').toLowerCase() === selectedRarity;

      return matchesSearch && matchesGame && matchesRarity;
    });
  });

  readonly availableGames = computed(() =>
    [...new Set(this.products().map((product) => product.game).filter(Boolean) as string[])].sort(),
  );

  readonly availableRarities = computed(() =>
    [...new Set(this.products().map((product) => product.rarity).filter(Boolean) as string[])].sort(),
  );

  readonly availableCategories = computed(() => this.categories());

  constructor() {
    this.loadProducts();
    this.loadCategories();
  }

  openCreateForm(): void {
    this.startCreate();

    queueMicrotask(() => {
      this.formPanel()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set('');

    this.productService
      .getProducts({ page: 1, limit: 300, sort: 'newest', includeInactive: true })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.products.set(response.data ?? []);
        },
        error: (error: unknown) => {
          this.error.set(this.resolveErrorMessage(error));
        },
      });
  }

  loadCategories(): void {
    this.categoryService
      .getCategories(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.categories.set(response.data ?? []);
        },
        error: (error: unknown) => {
          this.error.set(this.resolveErrorMessage(error));
        },
      });
  }

  startCreate(): void {
    this.selectedProductId.set(null);
    this.productForm.reset({
      name: '',
      price: 0,
      image: '',
      mainImage: '',
      subImage: '',
      game: '',
      rarity: 'Premium',
      stock: 0,
      sales: 0,
      description: '',
      category: '',
      releaseDate: '',
      isNew: false,
      isLimited: false,
      isActive: true,
    });
  }

  startEdit(product: Product): void {
    this.selectedProductId.set(product._id ?? null);
    this.productForm.reset({
      name: product.name,
      price: product.price,
      image: product.image ?? '',
      mainImage: product.mainImage ?? '',
      subImage: product.subImage ?? '',
      game: product.game ?? '',
      rarity: product.rarity ?? 'Premium',
      stock: product.stock ?? 0,
      sales: product.sales ?? 0,
      description: product.description ?? '',
      category: this.resolveCategoryId(product.category),
      releaseDate: product.releaseDate ? this.toDateInputValue(product.releaseDate) : '',
      isNew: product.isNew ?? false,
      isLimited: product.isLimited ?? false,
      isActive: product.isActive ?? true,
    });
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const formValue = this.productForm.getRawValue();
    const fallbackImage =
      formValue.image.trim() || formValue.mainImage.trim() || formValue.subImage.trim();

    if (!fallbackImage) {
      this.error.set('Vui lòng nhập ít nhất một đường dẫn ảnh sản phẩm.');
      return;
    }

    const payload: Partial<Product> = {
      name: formValue.name.trim(),
      price: formValue.price,
      image: fallbackImage,
      mainImage: formValue.mainImage.trim() || undefined,
      subImage: formValue.subImage.trim() || undefined,
      game: formValue.game,
      rarity: formValue.rarity,
      stock: formValue.stock,
      sales: formValue.sales,
      description: formValue.description.trim(),
      category: formValue.category || undefined,
      releaseDate: formValue.releaseDate ? new Date(formValue.releaseDate).toISOString() : undefined,
      isNew: formValue.isNew,
      isLimited: formValue.isLimited,
      isActive: formValue.isActive,
    };

    const selectedProductId = this.selectedProductId();
    const request$ = selectedProductId
      ? this.productService.updateProduct(selectedProductId, payload)
      : this.productService.createProduct(payload);

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.searchTerm.set('');
          this.gameFilter.set('all');
          this.rarityFilter.set('all');
          this.success.set(selectedProductId ? 'Cập nhật sản phẩm thành công.' : 'Thêm sản phẩm thành công.');
          this.startCreate();
          this.loadProducts();
        },
        error: (error: unknown) => {
          this.error.set(this.resolveErrorMessage(error));
        },
      });
  }

  toggleVisibility(product: Product): void {
    const productId = product._id;
    if (!productId) {
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    const payload: Partial<Product> = {
      name: product.name,
      price: product.price,
      image: product.image,
      mainImage: product.mainImage,
      subImage: product.subImage,
      game: product.game,
      rarity: product.rarity,
      stock: product.stock,
      sales: product.sales,
      description: product.description,
      category: this.resolveCategoryId(product.category),
      releaseDate: product.releaseDate,
      isNew: product.isNew,
      isLimited: product.isLimited,
      isActive: !product.isActive,
    };

    this.productService
      .updateProduct(productId, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.success.set(product.isActive ? 'Đã ẩn sản phẩm.' : 'Đã hiển thị lại sản phẩm.');
          this.loadProducts();
        },
        error: (error: unknown) => {
          this.error.set(this.resolveErrorMessage(error));
        },
      });
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onGameFilterInput(event: Event): void {
    this.gameFilter.set((event.target as HTMLSelectElement).value);
  }

  onRarityFilterInput(event: Event): void {
    this.rarityFilter.set((event.target as HTMLSelectElement).value);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  }

  formatDate(value?: string | Date): string {
    if (!value) {
      return '--';
    }

    return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
  }

  resolveImage(product: Product): string {
    return product.image || product.mainImage || product.subImage || '/assets/img/placeholder.png';
  }

  resolveCategoryName(category: Product['category']): string {
    if (!category) {
      return 'N/A';
    }

    if (typeof category === 'string') {
      return this.categories().find((item) => item._id === category)?.name ?? 'N/A';
    }

    return category.name ?? 'N/A';
  }

  resolveCategoryId(category: Product['category']): string {
    if (!category) {
      return '';
    }

    if (typeof category === 'string') {
      return category;
    }

    return category._id;
  }

  getStatusLabel(product: Product): string {
    return product.isActive === false ? 'Đã ẩn' : 'Đang bán';
  }

  trackByProductId(_index: number, product: Product): string {
    return product._id ?? product.name;
  }

  getFieldError(fieldName: keyof typeof this.productForm.controls): string {
    const control = this.productForm.controls[fieldName];

    if (!control || !(control.touched || control.dirty) || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      const requiredMessages: Partial<Record<keyof typeof this.productForm.controls, string>> = {
        name: 'Tên sản phẩm là bắt buộc.',
        price: 'Giá sản phẩm là bắt buộc.',
        image: 'Ảnh chính là bắt buộc.',
        game: 'Bạn cần chọn game.',
        rarity: 'Bạn cần chọn độ hiếm.',
        stock: 'Tồn kho là bắt buộc.',
        sales: 'Doanh số là bắt buộc.',
        description: 'Mô tả sản phẩm là bắt buộc.',
      };

      return requiredMessages[fieldName] ?? 'Trường này là bắt buộc.';
    }

    if (control.errors['minlength']) {
      const minLengthMessages: Partial<Record<keyof typeof this.productForm.controls, string>> = {
        name: 'Tên phải có ít nhất 2 ký tự.',
        description: 'Mô tả phải có ít nhất 10 ký tự.',
      };

      return minLengthMessages[fieldName] ?? 'Giá trị nhập vào quá ngắn.';
    }

    if (control.errors['min']) {
      const minMessages: Partial<Record<keyof typeof this.productForm.controls, string>> = {
        price: 'Giá phải lớn hơn hoặc bằng 0.',
        stock: 'Tồn kho phải lớn hơn hoặc bằng 0.',
        sales: 'Doanh số phải lớn hơn hoặc bằng 0.',
      };

      return minMessages[fieldName] ?? 'Giá trị phải lớn hơn hoặc bằng 0.';
    }

    return 'Dữ liệu không hợp lệ.';
  }

  private toDateInputValue(value: string | Date): string {
    const date = new Date(value);
    return date.toISOString().slice(0, 10);
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

    return 'Không thể tải sản phẩm. Vui lòng thử lại.';
  }
}
