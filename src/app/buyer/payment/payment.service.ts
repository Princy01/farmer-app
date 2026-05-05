import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface InitiatePaymentRequest {
  amount: number;
  currency: string;
  description: string;
  checkout_session_id?: number;
  provider_code?: string;
  payment_method?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  initiatePayment(request: InitiatePaymentRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/payments/initiate`, request);
  }

   checkPaymentStatus(orderId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/payments/status/${orderId}`);
  }
}