import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { Product } from '../../interfaces/product';
import { ProductService } from '../services/product.service';

export const homeProductsResolver: ResolveFn<Product[]> = () => {
  const productService = inject(ProductService);

  return productService.getProducts({ limit: 100 }).pipe(
    map((response) => response.data ?? []),
    catchError(() => of([])),
  );
};