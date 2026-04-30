import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Product } from '../../interfaces/product';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-product-item',
  imports: [CommonModule],
  templateUrl: './product-item.html',
  styleUrl: './product-item.css',
})
export class ProductItem {
  @Input() p!: Product;
  private router = inject(Router);
  private cartService = inject(CartService);

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
    return rarityMap[this.p.rarity || ''] || '';
  }

  getProductSlug(): string {
    return encodeURIComponent(this.p.name.toLowerCase().replace(/\s/g, '-'));
  }

  goToDetail() {
    this.router.navigate(['/product', this.getProductSlug()]);
  }

  addToCart() {
    if (!this.p._id) {
      return;
    }

    this.cartService.addToCart(this.p, 1).subscribe({
      error: (error) => {
        if (error.status === 401) {
          this.router.navigate(['/login']);
        }
      },
    });
  }
}
