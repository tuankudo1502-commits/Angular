import { Component, OnInit } from '@angular/core';
import { ProductList } from '../product-list/product-list';
import { Product } from '../../interfaces/product';
import { ProductService } from '../services/product-service';

@Component({
  selector: 'app-home',
  imports: [ProductList],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home {

  newProduct: Product[] = [];

  featuresProduct: Product[] = [
    { name: 'Product 1', price: 100, image: 'https://via.placeholder.com/150' },
    { name: 'Product 2', price: 200, image: 'https://via.placeholder.com/150' },
    { name: 'Product 3', price: 300, image: 'https://via.placeholder.com/150' },
  ];

  constructor(private ps: ProductService) {}

  ngOnInit(): void {
    this.ps.getProducts().subscribe((data) => {
      this.newProduct = data;
    });
    this.ps.getFeaturedProducts().subscribe((data) => {
      this.featuresProduct = data;
    });
  }
}