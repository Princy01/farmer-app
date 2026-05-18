import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_id: number;
  unit_name: string;
  price: number;
  discount_amount: number;
  tax_amount: number;
  wholeseller_id: number;
  wholeseller_name: string;
}

export interface RetailerOrderDetails {
  order_id: number;
  order_ids?: number[];
  checkout_session_id?: number | null;
  date_of_order: string;
  order_status: number;
  order_status_name: string;
  actual_delivery_date?: string | null;
  retailer_id: number;
  wholeseller_ids: number[];
  delivery_address: string;
  total_order_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  items: OrderItem[];
}

export interface CancelRetailerOrderResponse {
  status: string;
  message: string;
}

/**
 * Service for managing retailer order details.
 * Handles API communication with automatic retry and timeout logic.
 */
@Injectable({
  providedIn: 'root'
})
export class RetailerOrderService {
  private apiUrl = environment.apiUrl;
  private readonly HTTP_TIMEOUT = 30000; // 30 seconds

  constructor(private http: HttpClient) {}

  /**
   * Fetches retailer order details by order ID.
   * Includes automatic retry with exponential backoff and 30-second timeout.
   * @param orderId The ID of the order to fetch
   * @returns Observable of order details
   */
  getOrderDetails(orderId: number): Observable<RetailerOrderDetails> {
    return this.http.get<RetailerOrderDetails>(
      `${this.apiUrl}/getRetailerOrderDetails/${orderId}`
    ).pipe(
      timeout(this.HTTP_TIMEOUT),
      retry({
        count: 3,
        delay: (error, retryCount) => {
          // Exponential backoff: 1s, 2s, 4s
          const delayMs = Math.pow(2, retryCount - 1) * 1000;
          return new Promise<void>(resolve => setTimeout(() => resolve(), delayMs));
        }
      }),
      catchError((error: HttpErrorResponse | TimeoutError) => this.handleError(error))
    );
  }

  cancelOrder(orderId: number, reason: string = 'retailer_cancelled'): Observable<CancelRetailerOrderResponse> {
    return this.http.post<CancelRetailerOrderResponse>(
      `${this.apiUrl}/retailer/orders/${orderId}/cancel`,
      { cancellation_reason: reason }
    ).pipe(
      timeout(this.HTTP_TIMEOUT),
      retry({
        count: 2,
        delay: (error, retryCount) => {
          const delayMs = Math.pow(2, retryCount - 1) * 1000;
          return new Promise<void>(resolve => setTimeout(() => resolve(), delayMs));
        }
      }),
      catchError((error: HttpErrorResponse | TimeoutError) => this.handleError(error))
    );
  }

  /**
   * Handles HTTP errors and maps them to user-friendly messages.
   * Error translation keys are returned for component-side translation.
   * @param error The HTTP error response or timeout error
   * @returns Observable that throws an error with a translation key
   */
  private handleError(error: HttpErrorResponse | TimeoutError): Observable<never> {
    let translationKey = 'RETAILER_ORDER_DETAILS.ERROR_LOAD_FAILED';

    if (error instanceof TimeoutError) {
      translationKey = 'REQUEST_TIMEOUT_ERROR';
    } else if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        translationKey = 'NETWORK_ERROR';
      } else if (error.status === 401) {
        translationKey = 'SESSION_EXPIRED';
      } else if (error.status === 403) {
        translationKey = 'ACCESS_DENIED';
      } else if (error.status === 404) {
        translationKey = 'NOT_FOUND';
      } else if (error.status === 408) {
        translationKey = 'REQUEST_TIMEOUT_ERROR';
      } else if (error.status >= 500) {
        translationKey = 'SERVER_ERROR';
      }
    }

    const apiError = new Error(translationKey);
    return throwError(() => apiError);
  }
}
