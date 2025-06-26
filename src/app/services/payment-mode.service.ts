import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentModeService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createPaymentMode(paymentModeData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/paymentModes`, paymentModeData);
  }

  getPaymentModes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getModeOfPayments`);
  }

  getPaymentModeById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/getPaymentModeById/${id}`);
  }

  updatePaymentMode(id: number, updatedData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/paymentModeUpdate/${id}`, updatedData);
  }

  deletePaymentMode(id: number): Observable<any> {
    // Need to create this API endpoint in your backend
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
