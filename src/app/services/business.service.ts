import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

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
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}


  getBusinesses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getBusinesses`);
  }

  insertBusiness(business: Business): Observable<any> {
    return this.http.post(`${this.apiUrl}/businessDetails`, business);
  }

  getBusinessById(bid: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${bid}`);
  }

  updateBusiness(business: Business): Observable<any> {
    return this.http.put(`${this.apiUrl}/businessUpdate`, business);
  }

  // deleteBusiness(bid: number): Observable<any> {
  //   return this.http.delete(`${this.apiUrl}/delete/${bid}`);
  // }

  getBusinessTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getBusinessStatus`);
  }

  getLocations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getLocations`);
  }

  getStates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getStates`);
  }

  getMandis(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getMandis`);
  }
}
