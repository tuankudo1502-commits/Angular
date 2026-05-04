import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Product } from '../../interfaces/product';
import { environment } from '../../environments/environment';

export interface CartItem extends Product {
  quantity: number;
  selectedAt?: Date;
}

interface CartApiResponse {
  success: boolean;
  data: CartItem[];
  summary?: {
    subtotal: number;
    shippingFee: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadCart();
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.loadCart();
      } else {
        this.setCartItems([]);
      }
    });
  }

  getCart(): Observable<CartItem[]> {
    return this.cartSubject.asObservable();
  }

  getCartCount(): Observable<number> {
    return this.cartSubject
      .asObservable()
      .pipe(map((items) => items.reduce((sum, item) => sum + item.quantity, 0)));
  }

  addToCart(product: Product, quantity: number = 1): Observable<CartItem[]> {
    return this.http
      .post<CartApiResponse>(`${environment.apiBaseUrl}/cart`, {
        productId: product._id,
        quantity,
      })
      .pipe(
        tap((response) => this.setCartItems(response.data ?? [])),
        map((response) => response.data ?? []),
      );
  }

  updateQuantity(productId: string, quantity: number): Observable<CartItem[]> {
    return this.http
      .put<CartApiResponse>(`${environment.apiBaseUrl}/cart/${productId}`, {
        quantity,
      })
      .pipe(
        tap((response) => this.setCartItems(response.data ?? [])),
        map((response) => response.data ?? []),
      );
  }

  removeFromCart(productId: string): Observable<CartItem[]> {
    return this.http.delete<CartApiResponse>(`${environment.apiBaseUrl}/cart/${productId}`).pipe(
      tap((response) => this.setCartItems(response.data ?? [])),
      map((response) => response.data ?? []),
    );
  }

  clearCart(): Observable<CartItem[]> {
    return this.http.delete<CartApiResponse>(`${environment.apiBaseUrl}/cart`).pipe(
      tap((response) => this.setCartItems(response.data ?? [])),
      map((response) => response.data ?? []),
    );
  }

  getSubtotal(): number {
    return this.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  getShippingFee(): number {
    const subtotal = this.getSubtotal();
    if (subtotal === 0) return 0;
    return subtotal >= 500000 ? 0 : 30000;
  }

  getTotal(): number {
    return this.getSubtotal() + this.getShippingFee();
  }

  private setCartItems(items: CartItem[]): void {
    this.cartItems = items;
    this.cartSubject.next([...this.cartItems]);
  }

  private loadCart(): void {
    if (!this.isBrowser || !this.authService.getToken()) {
      this.cartSubject.next([]);
      return;
    }

    this.http.get<CartApiResponse>(`${environment.apiBaseUrl}/cart`).subscribe({
      next: (response) => this.setCartItems(response.data ?? []),
      error: () => this.setCartItems([]),
    });
  }
}
