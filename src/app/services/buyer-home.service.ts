import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Category {
  category_id: number;
  category_name: string;
  super_cat_id: number;
  remarks: string;
}

@Injectable({
  providedIn: 'root',
})
export class BuyerHomeService {
  private baseUrl = 'http://127.0.0.1:3000';

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  addCategory(category: Partial<Category>): Observable<any> {
    return this.http.post(`${this.baseUrl}/category`, category);
  }

  updateCategory(category: Category): Observable<any> {
    return this.http.put(`${this.baseUrl}/category`, category);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/category/${id}`);
  }
}
