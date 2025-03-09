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
    // Need to create this API endpoint in your backend
    throw new Error('Method not implemented.');
        
    return this.http.post(`${this.baseUrl}/create`, paymentModeData);
  }

  getPaymentModes(): Observable<any> {
    return this.http.get(`${this.baseUrl}/getModeOfPayments`);
  }

  getPaymentModeById(id: number): Observable<any> {
    // Need to create this API endpoint in your backend
    throw new Error('Method not implemented.');
    return this.http.get(`${this.baseUrl}/getModeOfPayments/${id}`);
  }

  updatePaymentMode(id: number, updatedData: any): Observable<any> {
    // Need to create this API endpoint in your backend
    throw new Error('Method not implemented.');
    return this.http.put(`${this.baseUrl}/update/${id}`, updatedData);
  }

  deletePaymentMode(id: number): Observable<any> {
    // Need to create this API endpoint in your backend
    throw new Error('Method not implemented.');
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
