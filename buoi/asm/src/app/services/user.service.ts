import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface UserRecord {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);

  getUsers(params?: { search?: string; role?: string }): Observable<ApiResponse<UserRecord[]>> {
    let httpParams = new HttpParams();

    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }

    if (params?.role && params.role !== 'all') {
      httpParams = httpParams.set('role', params.role);
    }

    return this.http.get<ApiResponse<UserRecord[]>>(`${environment.apiBaseUrl}/users`, {
      params: httpParams,
      transferCache: false,
    });
  }

  updateUser(id: string, payload: Partial<UserRecord>): Observable<ApiResponse<UserRecord>> {
    return this.http.put<ApiResponse<UserRecord>>(`${environment.apiBaseUrl}/users/${id}`, payload);
  }
}
