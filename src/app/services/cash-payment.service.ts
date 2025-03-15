import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CashPaymentService {
  private baseUrl = 'http://localhost:3000'; // Update with actual API URL

  constructor(private http: HttpClient) {}

  createPayment(paymentData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/listPaymentsDetails`, paymentData);
  }

  getAllPayments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/getListPaymentMethod`);
  }

  getPaymentById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/getPaymentTypeById/${id}`);
  }

  updatePayment(id: number, updatedData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/listPaymentUpdate/${id}`, updatedData);
  }

  deletePayment(id: number): Observable<any> {
    // need to create this API endpoint
    return this.http.delete(`${this.baseUrl}/deletePaymentMethod/${id}`);
  }
}
