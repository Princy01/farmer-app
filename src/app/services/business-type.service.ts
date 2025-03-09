import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BusinessTypeService {
  private apiUrl = 'http://localhost:3000'; // Replace with your actual API endpoint

  constructor(private http: HttpClient) {}

  createBusinessType(businessType: any): Observable<any> {
    // route assumed to be /insertBusinessType
    return this.http.post(`${this.apiUrl}/insertBusinessType`, businessType);
  }

  getBusinessTypes(): Observable<any[]> {
    // needs name change for route
    return this.http.get<any[]>(`${this.apiUrl}/getBusinessStatus`);
  }

  getBusinessTypeById(id: number): Observable<any> {
    // needs to create a route for this
    return this.http.get<any>(`${this.apiUrl}/getBusinessStatus/${id}`);
  }

  updateBusinessType(id: number, businessType: any): Observable<any> {
    // needs to create a route for this
    return this.http.put(`${this.apiUrl}/updateBusinessType/${id}`, businessType);
  }

  deleteBusinessType(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteBusinessType/${id}`);
  }
}
