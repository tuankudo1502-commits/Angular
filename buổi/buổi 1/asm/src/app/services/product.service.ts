import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../../interfaces/product';
import { environment } from '../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private http: HttpClient) {}

  getProducts(params?: {
    game?: string;
    rarity?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
    includeInactive?: boolean;
  }): Observable<ApiResponse<Product[]>> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null && value !== 'all') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<Product[]>>(`${environment.apiBaseUrl}/products`, {
      params: httpParams,
      transferCache: false,
    });
  }

  getProductBySlug(slug: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${environment.apiBaseUrl}/products/${slug}`, {
      transferCache: false,
    });
  }

  getNewProducts(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${environment.apiBaseUrl}/products/new`, {
      transferCache: false,
    });
  }

  getFeaturedProducts(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${environment.apiBaseUrl}/products/featured`, {
      transferCache: false,
    });
  }

  getRareProducts(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${environment.apiBaseUrl}/products/rare`, {
      transferCache: false,
    });
  }

  getRelatedProducts(productId: string): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(
      `${environment.apiBaseUrl}/products/${productId}/related`,
      { transferCache: false },
    );
  }

  createProduct(productData: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${environment.apiBaseUrl}/products`, productData);
  }

  updateProduct(id: string, productData: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(
      `${environment.apiBaseUrl}/products/${id}`,
      productData,
    );
  }

  deleteProduct(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${environment.apiBaseUrl}/products/${id}`);
  }
}
