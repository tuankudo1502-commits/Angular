import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  phone?: string;
  address?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authStorageKey = 'token';
  private readonly currentUserStorageKey = 'currentUser';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isBrowser: boolean;

  currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.restoreCurrentUserFromStorage();

    if (this.isBrowser && this.getToken()) {
      this.refreshCurrentUser().subscribe();
    }
  }

  login(credentials: LoginRequest, rememberMe: boolean = true): Observable<LoginResponse> {
    const payload: LoginRequest = {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    };

    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, payload).pipe(
      tap((response) => {
        if (response.success && response.token) {
          this.setToken(response.token, rememberMe);
          this.setCurrentUser(response.user, rememberMe);
        }
      }),
    );
  }

  register(userData: RegisterRequest): Observable<LoginResponse> {
    const payload: RegisterRequest = {
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      phone: userData.phone.trim(),
      password: userData.password,
    };

    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/register`, payload).pipe(
      tap((response) => {
        if (response.success && response.token) {
          this.setToken(response.token, true);
          this.setCurrentUser(response.user, true);
        }
      }),
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.authStorageKey);
      sessionStorage.removeItem(this.authStorageKey);
      localStorage.removeItem(this.currentUserStorageKey);
      sessionStorage.removeItem(this.currentUserStorageKey);
      this.currentUserSubject.next(null);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(this.authStorageKey) || sessionStorage.getItem(this.authStorageKey);
    }
    return null;
  }

  private setToken(token: string, rememberMe: boolean): void {
    if (this.isBrowser) {
      if (rememberMe) {
        localStorage.setItem(this.authStorageKey, token);
        sessionStorage.removeItem(this.authStorageKey);
      } else {
        sessionStorage.setItem(this.authStorageKey, token);
        localStorage.removeItem(this.authStorageKey);
      }
    }
  }

  private setCurrentUser(user: User, rememberMe?: boolean): void {
    if (this.isBrowser) {
      const storage = this.getStorageForPersistence(rememberMe);
      if (storage) {
        storage.setItem(this.currentUserStorageKey, JSON.stringify(user));
      }
      this.currentUserSubject.next(user);
    }
  }

  private restoreCurrentUserFromStorage(): void {
    if (!this.isBrowser) {
      return;
    }

    const storedUser = this.readStoredUser();
    if (storedUser) {
      this.currentUserSubject.next(storedUser);
    }
  }

  private readStoredUser(): User | null {
    if (!this.isBrowser) {
      return null;
    }

    const rawUser =
      localStorage.getItem(this.currentUserStorageKey) ||
      sessionStorage.getItem(this.currentUserStorageKey);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as User;
    } catch {
      return null;
    }
  }

  private getStorageForPersistence(rememberMe?: boolean): Storage | null {
    if (!this.isBrowser) {
      return null;
    }

    if (rememberMe === true) {
      return localStorage;
    }

    if (rememberMe === false) {
      return sessionStorage;
    }

    return localStorage.getItem(this.authStorageKey) ? localStorage : sessionStorage;
  }

  refreshCurrentUser(): Observable<User | null> {
    if (!this.isBrowser || !this.getToken()) {
      this.currentUserSubject.next(null);
      return of(null);
    }

    return this.http
      .get<{ success: boolean; user: User }>(`${environment.apiBaseUrl}/auth/me`)
      .pipe(
        map((response) => (response.success ? response.user : null)),
        tap((user) => {
          if (user) {
            this.setCurrentUser(user);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401 || error.status === 403) {
            this.logout();
            return of(null);
          }

          const cachedUser = this.readStoredUser();
          if (cachedUser) {
            this.currentUserSubject.next(cachedUser);
            return of(cachedUser);
          }

          return of(null);
        }),
      );
  }
}
