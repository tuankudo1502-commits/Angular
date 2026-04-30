import { Component, Input } from '@angular/core';
import { Product } from '../../interfaces/product';

@Component({
  selector: 'app-product-item',
  imports: [],
  templateUrl: './product-item.html',
  styleUrl: './product-item.css',
})
export class ProductItem {
  @Input() p:Product = {
    name: 'Iphone 14 Pro Max',
    price: 1099,
    image: 'https://gacbepbamien.com/wp-content/uploads/2026/01/meo-meme-10.jpg'
  }
}
