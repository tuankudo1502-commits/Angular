import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
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

export interface OrderItem {
  product?: {
    _id: string;
    name?: string;
    image?: string;
  };
  name?: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface OrderRecord {
  _id: string;
  user?: {
    _id: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'cod' | 'banking' | 'momo';
  paymentStatus: 'pending' | 'paid' | 'failed';
  shippingAddress?: {
    name?: string;
  };
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);

  getOrders(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<ApiResponse<OrderRecord[]>> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return this.http.get<ApiResponse<OrderRecord[]>>(`${environment.apiBaseUrl}/orders`, {
      params: httpParams,
      transferCache: false,
    });
  }
}
