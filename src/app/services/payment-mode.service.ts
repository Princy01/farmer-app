import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentModeService {
  private baseUrl = 'http://localhost:3000/'; // Update with your actual API URL

  constructor(private http: HttpClient) {}

  createPaymentMode(paymentModeData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/paymentModes`, paymentModeData);
  }

  getPaymentModes(): Observable<any> {
    return this.http.get(`${this.baseUrl}/getModeOfPayments`);
  }

  getPaymentModeById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/getPaymentModeById/${id}`);
  }

  updatePaymentMode(id: number, updatedData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/paymentModeUpdate/${id}`, updatedData);
  }

  deletePaymentMode(id: number): Observable<any> {
    // Need to create this API endpoint in your backend
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
