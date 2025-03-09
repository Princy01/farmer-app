import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Business {
  b_typeid: number;
  b_name: string;
  b_location_id: number;
  b_state_id: number;
  b_mandi_id: number | null;
  b_address: string;
  b_phone_num?: string | null;
  b_email: string;
  b_gst_num: string;
  b_pan_num: string;
}

@Injectable({
  providedIn: 'root'
})
export class BusinessService {
  private baseUrl = 'http://localhost:3000'; // Update with actual API URL

  constructor(private http: HttpClient) {}


  getBusinesses(): Observable<any> {
    return this.http.get(`${this.baseUrl}/getBusinesses`);
  }

  insertBusiness(business: Business): Observable<any> {
    return this.http.post(`${this.baseUrl}/businessDetails`, business);
  }

  getBusinessById(bid: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${bid}`);
  }

  updateBusiness(business: Business): Observable<any> {
    return this.http.put(`${this.baseUrl}/businessUpdate`, business);
  }

  // deleteBusiness(bid: number): Observable<any> {
  //   return this.http.delete(`${this.baseUrl}/delete/${bid}`);
  // }

  getBusinessTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/getBusinessStatus`);
  }

  getLocations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/getLocations`);
  }

  getStates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/getStates`);
  }

  getMandis(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/getMandis`);
  }
}
