import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { TranslateService } from '@ngx-translate/core';

export interface RetailerOrderHistory {
  order_id: number;
  checkout_session_id?: number | null;
  checkout_order_count?: number;
  checkout_delivery_amount?: number;
  checkout_gross_amount?: number;
  date_of_order: string;
  order_status: number | null;
  order_status_name?: string | null;
  delivery_address: string;
  total_order_amount: number;
  discount_amount: number;
  tax_amount: number;
  delivery_amount: number;
  final_amount: number;
  actual_delivery_date?: string | null;
  transport?: OrderTransportStatus | null;
}

export interface OrderTransportStatus {
  job_id?: number | null;
  job_status?: string;
  delivery_status?: string;
  cancelled_at?: string | null;
  status_label?: string;
  status_note?: string;
  needs_admin_action?: boolean;
}

export interface RetailerOrderHistoryResponse {
  current_orders: RetailerOrderHistory[];
  order_history: RetailerOrderHistory[];
  checkout_sessions: RetailerCheckoutSessionSummary[];
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

export interface RetailerCheckoutSessionsResponse {
  status: string;
  message: string;
  data: {
    checkout_sessions: RetailerCheckoutSessionSummary[];
  };
}

export interface RetailerCancellationResponse<T = unknown> {
  status: string;
  message?: string;
  data?: T;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RetailerOrderHistoryService {
  private apiUrl = environment.apiUrl;
  private readonly HTTP_TIMEOUT_MS = 30000; // 30 seconds

  constructor(
    private http: HttpClient,
    private translate: TranslateService
  ) {}

  getOrderHistory(): Observable<RetailerOrderHistoryResponse> {
    return this.http.get<RetailerOrderHistoryResponse>(
      `${this.apiUrl}/order_history`
    ).pipe(
      // Apply HTTP timeout: 30 seconds
      timeout(this.HTTP_TIMEOUT_MS),
      // Retry with exponential backoff: 1s, 2s, 4s (max 3 retries)
      retry({
        count: 3,
        delay: (error, retryCount) => {
          const delayMs = Math.pow(2, retryCount - 1) * 1000; // 1s, 2s, 4s
          return timer(delayMs);
        },
      }),
      catchError((error) => this.handleError(error))
    );
  }

  cancelCheckoutSession(
    checkoutSessionId: number,
    reason = 'retailer_cancelled'
  ): Observable<RetailerCancellationResponse<RetailerCheckoutSessionSummary>> {
    return this.http.post<RetailerCancellationResponse<RetailerCheckoutSessionSummary>>(
      `${this.apiUrl}/retailer/checkout-sessions/${checkoutSessionId}/cancel`,
      { reason }
    ).pipe(
      timeout(this.HTTP_TIMEOUT_MS),
      catchError((error) => this.handleError(error))
    );
  }

  cancelPaidOrder(
    orderId: number,
    reason = 'retailer_cancelled'
  ): Observable<RetailerCancellationResponse> {
    return this.http.post<RetailerCancellationResponse>(
      `${this.apiUrl}/retailer/orders/${orderId}/cancel`,
      { reason }
    ).pipe(
      timeout(this.HTTP_TIMEOUT_MS),
      catchError((error) => this.handleError(error))
    );
  }

  private handleError(error: any): Observable<never> {
    let userFriendlyMessage: string;

    // Handle TimeoutError from RxJS timeout operator
    if (error.name === 'TimeoutError') {
      userFriendlyMessage = this.translate.instant(
        'RETAILER_ORDER_HISTORY.ERROR_TIMEOUT'
      );
      return throwError(() => new Error(userFriendlyMessage));
    }

    // Handle HttpErrorResponse
    if (error instanceof HttpErrorResponse) {
      if (error.error instanceof ErrorEvent) {
        // Client-side error (network error)
        userFriendlyMessage = this.translate.instant(
          'RETAILER_ORDER_HISTORY.ERROR_NETWORK'
        );
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            // Network error or CORS issue
            userFriendlyMessage = this.translate.instant(
              'RETAILER_ORDER_HISTORY.ERROR_NETWORK'
            );
            break;
          case 401:
            // Unauthorized - should be handled by auth interceptor
            userFriendlyMessage = this.translate.instant(
              'RETAILER_ORDER_HISTORY.ERROR_UNAUTHORIZED'
            );
            break;
          case 403:
            // Forbidden
            userFriendlyMessage = this.translate.instant(
              'RETAILER_ORDER_HISTORY.ERROR_FORBIDDEN'
            );
            break;
          case 404:
            // Not found
            userFriendlyMessage = this.translate.instant(
              'RETAILER_ORDER_HISTORY.ERROR_NOT_FOUND'
            );
            break;
          case 408:
          case 504:
            // Timeout
            userFriendlyMessage = this.translate.instant(
              'RETAILER_ORDER_HISTORY.ERROR_TIMEOUT'
            );
            break;
          case 500:
          case 502:
          case 503:
            // Server error
            userFriendlyMessage = this.translate.instant(
              'RETAILER_ORDER_HISTORY.ERROR_SERVER'
            );
            break;
          default:
            // Generic error
            userFriendlyMessage = this.translate.instant(
              'RETAILER_ORDER_HISTORY.ERROR_MESSAGE'
            );
        }
      }
    } else {
      // Handle other error types
      userFriendlyMessage = this.translate.instant(
        'RETAILER_ORDER_HISTORY.ERROR_MESSAGE'
      );
    }

    return throwError(() => new Error(userFriendlyMessage));
  }
}
