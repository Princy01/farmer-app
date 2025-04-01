import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BusinessCategoryService {
  private baseUrl = 'http://127.0.0.1:3000';

  constructor(private http: HttpClient) {}

  // Fetch all business categories
  getBusinessCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/getBusinessCategory`);
  }

  // Fetch a single business category by ID
  getBusinessCategoryById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/getBusinessCategory?id=${id}`);
  }

  // Create a new business category
  createBusinessCategory(category: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/InsertBusinessCategory`, category);
  }

  // Update an existing business category
  updateBusinessCategory(category: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/businessCategoryUpdate`, category);
  }
}
