import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CashPaymentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createPayment(paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/listPaymentsDetails`, paymentData);
  }

  getAllPayments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getListPaymentMethod`);
  }

  getPaymentById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/getPaymentTypeById/${id}`);
  }

  updatePayment(id: number, updatedData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/listPaymentUpdate/${id}`, updatedData);
  }

  deletePayment(id: number): Observable<any> {
    // need to create this API endpoint
    return this.http.delete(`${this.apiUrl}/deletePaymentMethod/${id}`);
  }
}
