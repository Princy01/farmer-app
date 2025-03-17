import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Category {
  category_id?: number;
  category_name: string;
  super_cat_id?: number | null;
  remarks?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private baseUrl = 'http://127.0.0.1:3000';

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/getCategories`);
  }

  getCategoryById(categoryId: number): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/categories/${categoryId}`);
  }

  addCategory(category: Category): Observable<any> {
    return this.http.post(`${this.baseUrl}/categoryDetails`, category);
  }

  updateCategory(category: Category): Observable<any> {
    return this.http.put(`${this.baseUrl}/categoryUpdate`, category);
  }
}
