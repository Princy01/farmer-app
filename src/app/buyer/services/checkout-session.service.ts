import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, timer, throwError } from 'rxjs';
import { retry, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface CheckoutSessionItem {
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

export interface CheckoutSessionOrderGroup {
  wholeseller_id: number;
  branch_id: number;
  items: CheckoutSessionItem[];
  total_order_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
}

export interface CreateCheckoutSessionRequest {
  date_of_order: string;
  delivery_address: string;
  order_groups: CheckoutSessionOrderGroup[];
  delivery_amount: number;
  retailer_branch_id: number;
}

export interface CreateCheckoutSessionResponse {
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

export interface RetailerCheckoutSessionSummary {
  checkout_session_id: number;
  status: string;
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
  expired_at?: string | null;
  payment_timeout_at?: string | null;
  seconds_until_timeout?: number | null;
  last_payment_error_code?: string | null;
  last_payment_error?: string | null;
  can_resume_payment: boolean;
  can_retry_payment: boolean;
  retry_attempts_used?: number | null;
  max_retry_attempts?: number | null;
  retry_available_at?: string | null;
  retry_block_reason?: string | null;
  can_cancel_checkout: boolean;
  created_at: string;
  updated_at: string;
}

export interface RetailerCheckoutSessionDetailItem {
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

export interface RetailerCheckoutSessionDetailGroup {
  wholeseller_id: number;
  branch_id?: number | null;
  items: RetailerCheckoutSessionDetailItem[];
  total_order_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
}

export interface RetailerCheckoutSessionDetail {
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
  retry_attempts_used?: number | null;
  max_retry_attempts?: number | null;
  retry_available_at?: string | null;
  retry_block_reason?: string | null;
  can_cancel_checkout: boolean;
  order_groups: RetailerCheckoutSessionDetailGroup[];
  created_at: string;
  updated_at: string;
}

export interface RetailerCheckoutSessionDetailResponse {
  status: string;
  message: string;
  data: RetailerCheckoutSessionDetail;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutSessionService {
  private readonly requestTimeoutMs = 30000;
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createCheckoutSession(request: CreateCheckoutSessionRequest): Observable<CreateCheckoutSessionResponse> {
    return this.withResilience(this.http.post<CreateCheckoutSessionResponse>(
      `${this.apiUrl}/CreateRetailerCheckoutSession`,
      request
    ));
  }

  getCheckoutSessionDetail(checkoutSessionId: number): Observable<RetailerCheckoutSessionDetailResponse> {
    return this.withResilience(this.http.get<RetailerCheckoutSessionDetailResponse>(
      `${this.apiUrl}/retailer/checkout-sessions/${checkoutSessionId}`
    ));
  }

  private withResilience<T>(request$: Observable<T>): Observable<T> {
    return request$.pipe(
      timeout(this.requestTimeoutMs),
      retry({
        count: 3,
        delay: (error: unknown, retryCount: number) => {
          if (!this.shouldRetry(error)) {
            return throwError(() => error);
          }
          const delayMs = Math.pow(2, retryCount - 1) * 1000;
          return timer(delayMs);
        }
      })
    );
  }

  private shouldRetry(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    if (error.status === 0) {
      return true;
    }

    return error.status === 408 || error.status === 429 || error.status >= 500;
  }
}
