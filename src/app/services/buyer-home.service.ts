import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

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
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/getCategories`);
  }

  getCategoryById(categoryId: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categories/${categoryId}`);
  }

  addCategory(category: Category): Observable<any> {
    return this.http.post(`${this.apiUrl}/categoryDetails`, category);
  }

  updateCategory(category: Category): Observable<any> {
    return this.http.put(`${this.apiUrl}/categoryUpdate`, category);
  }
}
