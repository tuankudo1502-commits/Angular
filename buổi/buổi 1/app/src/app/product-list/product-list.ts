import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Product } from '../../interfaces/product';
import { ProductItem } from '../product-item/product-item';


@Component({
  selector: 'app-product-list',
  imports: [CommonModule, ProductItem],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  products:Product[] = [
    {
      name: 'Iphone 14 Pro Max',
      price: 1099,
      image: 'https://gacbepbamien.com/wp-content/uploads/2026/01/meo-meme-10.jpg'
    },
    {
      name: 'Samsung Galaxy S23 Ultra',
      price: 1199,
      image: 'https://gacbepbamien.com/wp-content/uploads/2026/01/meo-meme-10.jpg'
    },
    {
      name: 'Xiaomi Mi 13 Pro',
      price: 899,
      image: 'https://gacbepbamien.com/wp-content/uploads/2026/01/meo-meme-10.jpg'
    }
  ]
}
