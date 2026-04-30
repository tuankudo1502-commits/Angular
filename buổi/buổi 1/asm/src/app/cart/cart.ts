import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../services/cart.service';
import { ProductService } from '../services/product.service';
import { Product } from '../../interfaces/product';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  cartItems: CartItem[] = [];
  isLoading: boolean = true;
  recommendations: Product[] = [];
  isUpdating: boolean = false;

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.cartService.getCart().subscribe((items) => {
      this.cartItems = items;
      this.isLoading = false;
      this.loadRecommendations();
    });
  }

  loadRecommendations() {
    const games = [...new Set(this.cartItems.map((item) => item.game))];

    if (games.length > 0 && games[0]) {
      this.productService.getProducts({ game: games[0], limit: 4 }).subscribe({
        next: (response) => {
          this.recommendations = response.data.filter(
            (p: Product) => !this.cartItems.some((item) => item.name === p.name),
          );
        },
        error: (error) => {
          console.error('Error loading recommendations:', error);
        },
      });
    }
  }

  getRarityClass(rarity: string | undefined): string {
    if (!rarity) return '';

    const rarityMap: { [key: string]: string } = {
      Premium: 'rarity-premium',
      Deluxe: 'rarity-deluxe',
      Covert: 'rarity-covert',
      Ultra: 'rarity-ultra',
      Legendary: 'rarity-legendary',
      Ancient: 'rarity-ancient',
    };
    return rarityMap[rarity] || '';
  }

  getCartCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  isLowStock(item: CartItem): boolean {
    return item.stock ? item.stock <= 5 : false;
  }

  getStockStatus(item: CartItem): string {
    if (!item.stock) return 'Còn hàng';
    if (item.stock <= 0) return 'Hết hàng';
    if (item.stock <= 5) return `Chỉ còn ${item.stock} sản phẩm`;
    return `Còn ${item.stock} sản phẩm`;
  }

  getItemTotalFormatted(item: CartItem): string {
    return this.formatPrice(item.price * item.quantity);
  }

  getRecommendProducts(): Product[] {
    return this.recommendations;
  }

  updateQuantity(item: CartItem, quantity: number) {
    if (quantity < 1) return;
    if (item.stock && quantity > item.stock) {
      alert(`Chỉ còn ${item.stock} sản phẩm trong kho`);
      return;
    }
    this.isUpdating = true;
    if (!item._id) {
      this.isUpdating = false;
      return;
    }

    this.cartService.updateQuantity(item._id, quantity).subscribe({
      next: (items) => {
        this.cartItems = items;
        this.isUpdating = false;
      },
      error: () => {
        this.isUpdating = false;
      },
    });
  }

  removeItem(item: CartItem) {
    if (confirm(`Bạn có chắc muốn xóa "${item.name}" khỏi giỏ hàng?`)) {
      this.isUpdating = true;
      if (!item._id) {
        this.isUpdating = false;
        return;
      }

      this.cartService.removeFromCart(item._id).subscribe({
        next: (items) => {
          this.cartItems = items;
          this.isUpdating = false;
        },
        error: () => {
          this.isUpdating = false;
        },
      });
    }
  }

  clearCart() {
    if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm khỏi giỏ hàng?')) {
      this.isUpdating = true;
      this.cartService.clearCart().subscribe({
        next: (items) => {
          this.cartItems = items;
          this.isUpdating = false;
        },
        error: () => {
          this.isUpdating = false;
        },
      });
    }
  }

  getSubtotal(): number {
    return this.cartService.getSubtotal();
  }

  getShippingFee(): number {
    return this.cartService.getShippingFee();
  }

  getTotal(): number {
    return this.cartService.getTotal();
  }

  checkout() {
    if (this.cartItems.length === 0) {
      alert('Giỏ hàng của bạn đang trống!');
      return;
    }
    this.router.navigate(['/checkout']);
  }

  continueShopping() {
    this.router.navigate(['/products']);
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + 'đ';
  }

  addToCart(product: Product) {
    if (!product._id) {
      return;
    }

    this.cartService.addToCart(product, 1).subscribe({
      next: () => {
        alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
      },
      error: (error) => {
        if (error.status === 401) {
          this.router.navigate(['/login']);
        }
      },
    });
  }

  navigateToProduct(productName: string) {
    const slug = encodeURIComponent(productName.toLowerCase().replace(/\s/g, '-'));
    this.router.navigate(['/product', slug]);
  }
}
