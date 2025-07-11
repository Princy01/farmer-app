import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BusinessTypeService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createBusinessType(businessType: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/businessTypeDetails`, businessType);
  }

  getBusinessTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getBusinessTypes`);
  }

  getBusinessTypeById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getBusinessTypeById/${id}`);
  }

  updateBusinessType(id: number, businessType: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/updateBusinessType/${id}`, businessType);
  }

  deleteBusinessType(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteBusinessType/${id}`);
  }
}
