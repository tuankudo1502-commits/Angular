import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  parentCategory?: string | { _id: string; name: string } | null;
  isActive: boolean;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryPayload {
  name: string;
  description: string;
  image: string;
  parentCategory: string | null;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  constructor(private http: HttpClient) {}

  getCategories(activeOnly = false): Observable<ApiResponse<Category[]>> {
    let params = new HttpParams();

    if (activeOnly) {
      params = params.set('activeOnly', 'true');
    }

    return this.http.get<ApiResponse<Category[]>>(`${environment.apiBaseUrl}/categories`, {
      params,
      transferCache: false,
    });
  }

  createCategory(categoryData: CategoryPayload): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(`${environment.apiBaseUrl}/categories`, categoryData);
  }

  updateCategory(id: string, categoryData: CategoryPayload): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(
      `${environment.apiBaseUrl}/categories/${id}`,
      categoryData,
    );
  }

  deleteCategory(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${environment.apiBaseUrl}/categories/${id}`);
  }
}