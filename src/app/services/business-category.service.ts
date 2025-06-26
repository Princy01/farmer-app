import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BusinessCategoryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Fetch all business categories
  getBusinessCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getBusinessCategory`);
  }

  // Fetch a single business category by ID
  getBusinessCategoryById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getBusinessCategory?id=${id}`);
  }

  // Create a new business category
  createBusinessCategory(category: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/InsertBusinessCategory`, category);
  }

  // Update an existing business category
  updateBusinessCategory(category: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/businessCategoryUpdate`, category);
  }
}
