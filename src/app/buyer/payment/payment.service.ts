import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { CreateBatchOrderRequest } from '../order-confirmation/order.service';

export interface CheckoutSessionCreateResponse {
  status: string;
  message: string;
  data: {
    checkout_session_id: number;
    status: string;
    goods_amount: number;
    delivery_amount: number;
    gross_amount: number;
    platform_fee_amount: number;
    handling_charge_amount: number;
    payable_amount: number;
    order_groups_count: number;
    items_count: number;
  };
}

export interface CheckoutSessionDetailItem {
  selected_id?: number | null;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_id: number;
  unit_name: string;
  price: number;
  discount_amount: number;
  tax_amount: number;
  wholeseller_id: number;
  branch_id?: number | null;
}

export interface CheckoutSessionDetailGroup {
  wholeseller_id: number;
  branch_id?: number | null;
  items: CheckoutSessionDetailItem[];
  total_order_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
}

export interface CheckoutSessionDetailResponse {
  status: string;
  message: string;
  data: {
    checkout_session_id: number;
    status: string;
    retailer_branch_id: number;
    goods_amount: number;
    delivery_amount: number;
    gross_amount: number;
    platform_fee_amount: number;
    handling_charge_amount: number;
    payable_amount: number;
    delivery_address: string;
    current_payment_intent_id?: number | null;
    payment_started_at?: string | null;
    payment_failed_at?: string | null;
    payment_timeout_at?: string | null;
    seconds_until_timeout?: number | null;
    last_payment_error_code?: string | null;
    last_payment_error?: string | null;
    can_resume_payment: boolean;
    can_retry_payment: boolean;
    retry_attempts_used: number;
    max_retry_attempts: number;
    retry_available_at?: string | null;
    retry_block_reason?: string | null;
    can_cancel_checkout: boolean;
    order_groups: CheckoutSessionDetailGroup[];
    created_at: string;
    updated_at: string;
  };
}

export interface PaymentStatusResponse {
  success: boolean;
  data: {
    order_id: string;
    checkout_session_id?: number | null;
    payment_intent_id?: number | null;
    payment_id?: string | null;
    status: string;
    amount: number;
    order_ids?: number[];
    checkout_status?: string | null;
    materialized_at?: string | null;
    transaction_id?: string | null;
    created_at: string;
    paid_at?: string | null;
    failure_reason?: string | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createCheckoutSession(payload: CreateBatchOrderRequest): Observable<CheckoutSessionCreateResponse> {
    return this.http.post<CheckoutSessionCreateResponse>(`${this.apiUrl}/CreateRetailerCheckoutSession`, payload);
  }

  getCheckoutSession(checkoutSessionId: number): Observable<CheckoutSessionDetailResponse> {
    return this.http.get<CheckoutSessionDetailResponse>(`${this.apiUrl}/retailer/checkout-sessions/${checkoutSessionId}`);
  }

  initiatePayment(checkoutSessionId: number, paymentMethod: string): Observable<any> {
    const body = {
      checkout_session_id: checkoutSessionId,
      payment_method: paymentMethod,
      provider_code: 'gateway'
    };
    return this.http.post<any>(`${this.apiUrl}/payments/initiate`, body);
  }

   checkPaymentStatus(orderId: string): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(`${this.apiUrl}/payments/status/${orderId}`);
  }
}
