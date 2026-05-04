import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, distinctUntilChanged, filter, map, of, switchMap, tap } from 'rxjs';
import { Product } from '../../interfaces/product';
import { ProductService } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail implements OnInit {
  product: Product | null = null;
  relatedProducts: Product[] = [];
  quantity = 1;
  selectedImage = '';
  activeTab = 'description';
  isLoading = true;
  addedToCart = false;
  error: string = '';
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
  ) {}

  ngOnInit() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('name') ?? ''),
        filter((slug) => slug.length > 0),
        distinctUntilChanged(),
        tap(() => {
          this.isLoading = true;
          this.error = '';
          this.product = null;
          this.relatedProducts = [];
        }),
        switchMap((slug) =>
          this.productService.getProductBySlug(slug).pipe(
            switchMap((response) => {
              const product = response.data;
              this.product = product;
              this.selectedImage = product.image;
              this.quantity = 1;

              if (!product._id) {
                return of({ product, relatedProducts: [] as Product[] });
              }

              return this.productService.getRelatedProducts(product._id).pipe(
                map((relatedResponse) => ({
                  product,
                  relatedProducts: relatedResponse.data.filter((item) => item._id !== product._id),
                })),
                catchError(() => of({ product, relatedProducts: [] as Product[] })),
              );
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ product, relatedProducts }) => {
          this.product = product;
          this.relatedProducts = relatedProducts;
          this.selectedImage = product.image;
          this.isLoading = false;
        },
        error: () => {
          this.error = 'Không tìm thấy sản phẩm';
          this.isLoading = false;
        },
      });
  }

  changeImage(image: string) {
    this.selectedImage = image;
  }

  increaseQuantity() {
    if (this.product && this.quantity < (this.product.stock || 99)) {
      this.quantity++;
    }
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart() {
    if (!this.product) return;

    if (!this.product._id) {
      this.error = 'Thiếu mã sản phẩm để thêm vào giỏ hàng';
      return;
    }

    this.cartService.addToCart(this.product, this.quantity).subscribe({
      next: () => {
        this.addedToCart = true;
        setTimeout(() => {
          this.addedToCart = false;
        }, 2000);
      },
      error: (error) => {
        if (error.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.error = error.error?.message || 'Không thể thêm sản phẩm vào giỏ hàng';
      },
    });
  }

  buyNow() {
    if (!this.product) return;

    this.cartService.addToCart(this.product, this.quantity).subscribe({
      next: () => this.router.navigate(['/cart']),
      error: (error) => {
        if (error.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.error = error.error?.message || 'Không thể thêm sản phẩm vào giỏ hàng';
      },
    });
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + 'đ';
  }

  getRarityClass(): string {
    const rarityMap: { [key: string]: string } = {
      Premium: 'rarity-premium',
      Deluxe: 'rarity-deluxe',
      Covert: 'rarity-covert',
      Ultra: 'rarity-ultra',
      Legendary: 'rarity-legendary',
      Ancient: 'rarity-ancient',
    };
    return rarityMap[this.product?.rarity || ''] || '';
  }

  getStockStatus(): string {
    if (!this.product) return '';
    if (this.product.stock === 0) return 'Hết hàng';
    if (this.product.stock && this.product.stock < 10) return 'Sắp hết hàng';
    return 'Còn hàng';
  }

  getStockClass(): string {
    const status = this.getStockStatus();
    if (status === 'Hết hàng') return 'out-of-stock';
    if (status === 'Sắp hết hàng') return 'low-stock';
    return 'in-stock';
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  getWeaponType(name: string): string {
    if (name.includes('Vandal') || name.includes('Phantom')) return 'Súng trường';
    if (name.includes('Knife') || name.includes('Bayonet')) return 'Dao';
    if (name.includes('AWP')) return 'Súng bắn tỉa';
    if (name.includes('M4')) return 'Súng trường';
    return 'Vũ khí';
  }

  navigateToProduct(productName: string) {
    const slug = encodeURIComponent(productName.toLowerCase().replace(/\s/g, '-'));
    this.router.navigate(['/product', slug]);
  }

  getMaxQuantity(): number {
    return this.product?.stock ?? 99;
  }
}
