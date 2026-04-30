import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Product } from '../../../interfaces/product';
import { ProductService } from '../../services/product-service';

@Component({
  selector: 'app-list-product',
  imports: [CommonModule],
  templateUrl: './list-product.html',
  styleUrl: './list-product.css',
})
export class ListProduct {
  products: Product[] = [];
  constructor(private productService: ProductService) {}
  ngOnInit(): void {
    this.productService.getProducts().subscribe((data) => {
      this.products = data;
    });
  }
  addToCart(product: Product) {
    console.log('Add to cart:', product);
    // Implement your add to cart logic here
  }
}
