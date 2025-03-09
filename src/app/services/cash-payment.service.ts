import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CashPaymentService {
  private baseUrl = 'http://localhost:3000'; // Update with actual API URL

  constructor(private http: HttpClient) {}

  // Create a new cash payment type
  createPayment(paymentData: any): Observable<any> {
    // need to create this API endpoint
    return this.http.post(`${this.baseUrl}/insertPaymentMethod`, paymentData);
  }

  // Get all payment types
  getAllPayments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/getListPaymentMethod`);
  }

  // Get a payment type by ID
  getPaymentById(id: number): Observable<any> {
    // need to create this API endpoint
    return this.http.get(`${this.baseUrl}/getPaymentMethod/${id}`);
  }

  // Update a payment type
  updatePayment(id: number, updatedData: any): Observable<any> {
    // need to create this API endpoint
    return this.http.put(`${this.baseUrl}/updatePaymentMethod/${id}`, updatedData);
  }

  // Delete a payment type
  deletePayment(id: number): Observable<any> {
    // need to create this API endpoint
    return this.http.delete(`${this.baseUrl}/deletePaymentMethod/${id}`);
  }
}
