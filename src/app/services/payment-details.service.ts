import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type PaymentDestinationType = 'upi' | 'bank_account';

export interface PayeePayoutDestination {
  destination_id?: number;
  destination_type?: PaymentDestinationType;
  display_label?: string;
  account_holder_name?: string;
  upi_id?: string;
  bank_name?: string;
  branch_name?: string;
  ifsc_code?: string;
  account_number?: string;
  verification_status?: string;
  is_primary?: boolean;
  created_at?: string;
}

export interface PaymentDetailsResponse {
  payee_type: string;
  payee_id: number;
  verification_status: string;
  can_continue: boolean;
  redirect_to: string;
  total_count: number;
  items: PayeePayoutDestination[];
}

export interface PaymentDetailsSubmitRequest {
  destination_type: PaymentDestinationType;
  display_label: string;
  account_holder_name: string;
  upi_id?: string;
  bank_name?: string;
  branch_name?: string;
  ifsc_code?: string;
  account_number?: string;
  notes?: string;
}

export interface PaymentDetailsSubmitResponse {
  message: string;
  payee_type: string;
  payee_id: number;
  verification_status: string;
  can_continue: boolean;
  item: PayeePayoutDestination;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentDetailsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMyPaymentDetails(): Observable<PaymentDetailsResponse> {
    return this.http.get<PaymentDetailsResponse>(`${this.apiUrl}/payment-details/me`);
  }

  submitMyPaymentDetails(payload: PaymentDetailsSubmitRequest): Observable<PaymentDetailsSubmitResponse> {
    return this.http.post<PaymentDetailsSubmitResponse>(`${this.apiUrl}/payment-details/me`, payload);
  }
}
