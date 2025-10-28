import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  initiatePayment(amount: number, currency: string, description: string): Observable<any> {
    const body = {
      amount,
      currency,
      description
    };
    return this.http.post<any>(`${this.apiUrl}/payments/initiate`, body);
  }

   checkPaymentStatus(orderId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/payments/status/${orderId}`);
  }
}