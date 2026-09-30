import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, timeout, retryWhen, concatMap, finalize, shareReplay } from 'rxjs/operators';
import { timer } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface WholesalerOrderItem {
  order_item_id: number;
  product_id: number;
  product_name: string;
  category_id: number;
  category_name: string;
  quantity: number;
  unit_id: number;
  wholeseller_price: number;
  max_item_price: number;
  discount_amount: number;
  tax_amount: number;
  agreed_quantity: number;
  image_path?: string;
}

export interface WholesalerOrderSummary {
  order_id: number;
  date_of_order: string;
  order_status_id: number;
  order_status: string;
  retailer_id: number;
  retailer_name: string;
  total_items: number;
  total_quantity: number;
  total_order_amount: number;
  final_amount: number;
  delivery_address: string;
  actual_delivery_date?: string;
  created_at: string;
  updated_at: string;
  driver_id: number | null;
  driver_name: string | null;
  driver_contact: string | null;
  driver_assignment_status: string;
}

export interface WholesalerOrderDetails {
  order_id: number;
  date_of_order: string;
  order_status_id: number;
  order_status: string;
  retailer_id: number;
  retailer_name: string;
  total_order_amount: number;
  final_amount: number;
  delivery_address: string;
  actual_delivery_date?: string;
  created_at: string;
  updated_at: string;
  driver_id: number | null;
  driver_name: string | null;
  driver_contact: string | null;
  driver_assignment_status: string;
  otp?: string;
  items: WholesalerOrderItem[];
}

export interface PickupOTP {
  order_id: number;
  user_id: number;
  expires_at: string;
  is_used?: boolean;
  used_at?: string;
}

export interface OrderHistoryRow {
  history_id: number;
  order_status_id: number;
  order_status: string;
  command: string;
  at: string;
  user_id: number;
  cancellation_reason?: string;
}

export interface PickupConfirmation {
  order_id: number;
  otp: string;
}

export interface OrderStatus {
  order_status_id: number;
  order_status: string;
}

@Injectable({
  providedIn: 'root'
})
export class WholesalerOrderService {
  private apiUrl = environment.apiUrl;
  private statusesCache: OrderStatus[] | null = null;
  private statusesCacheExpiry: number = 0;
  private statusesObservableCache: Observable<OrderStatus[]> | null = null;
  private readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly HTTP_TIMEOUT_MS = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;

  constructor(private http: HttpClient) { }

  getWholesalerOrders(status?: number[]): Observable<WholesalerOrderSummary[]> {
    let params = new HttpParams();
    if (status && status.length > 0) {
      params = params.set('status', status.join(','));
    }
    return this.http.get<WholesalerOrderSummary[]>(`${this.apiUrl}/GetWholesalerOrders`, { params })
      .pipe(
        timeout(this.HTTP_TIMEOUT_MS),
        retryWhen(errors => errors.pipe(
          concatMap((err, idx) => {
            if (idx < this.MAX_RETRIES && this.isRetryableError(err)) {
              const delay = Math.pow(2, idx) * 1000;
              return timer(delay);
            }
            return throwError(() => err);
          })
        )),
        catchError(err => this.handleError(err))
      );
  }

  getWholesalerOrderDetails(id: number): Observable<WholesalerOrderDetails> {
    if (!id || id <= 0) {
      return throwError(() => ({
        message: 'PICKUP_ORDERS.ERRORS.INVALID_ORDER_ID',
        status: 400
      }));
    }

    return this.http.get<WholesalerOrderDetails>(`${this.apiUrl}/GetWholesalerOrders/${id}`)
      .pipe(
        timeout(this.HTTP_TIMEOUT_MS),
        retryWhen(errors => errors.pipe(
          concatMap((err, idx) => {
            if (idx < this.MAX_RETRIES && this.isRetryableError(err)) {
              const delay = Math.pow(2, idx) * 1000;
              return timer(delay);
            }
            return throwError(() => err);
          })
        )),
        catchError(err => this.handleError(err))
      );
  }

  generatePickupOtp(orderId: number): Observable<PickupOTP> {
    if (!orderId || orderId <= 0) {
      return throwError(() => ({
        message: 'PICKUP_ORDERS.ERRORS.INVALID_ORDER_ID',
        status: 400
      }));
    }

    return this.http.post<PickupOTP>(
      `${this.apiUrl}/transportation/delivery/generate-pickup-otp`,
      { order_id: orderId }
    )
      .pipe(
        timeout(this.HTTP_TIMEOUT_MS),
        retryWhen(errors => errors.pipe(
          concatMap((err, idx) => {
            // Only retry on network/timeout errors, not on 4xx/5xx application errors
            if (idx < this.MAX_RETRIES && this.isRetryableError(err)) {
              const delay = Math.pow(2, idx) * 1000;
              return timer(delay);
            }
            return throwError(() => err);
          })
        )),
        catchError(err => this.handleError(err))
      );
  }

  getOrderHistory(id: number): Observable<OrderHistoryRow[]> {
    if (!id || id <= 0) {
      return throwError(() => ({
        message: 'PICKUP_ORDERS.ERRORS.INVALID_ORDER_ID',
        status: 400
      }));
    }
    return this.http.get<OrderHistoryRow[]>(`${this.apiUrl}/GetWholesalerOrders/${id}/history`)
      .pipe(
        timeout(this.HTTP_TIMEOUT_MS),
        retryWhen(errors => errors.pipe(
          concatMap((err, idx) => {
            if (idx < this.MAX_RETRIES && this.isRetryableError(err)) {
              const delay = Math.pow(2, idx) * 1000;
              return timer(delay);
            }
            return throwError(() => err);
          })
        )),
        catchError(err => this.handleError(err))
      );
  }

  confirmPickup(orderId: number, otp: string): Observable<{ message: string }> {
    if (!orderId || orderId <= 0) {
      return throwError(() => ({
        message: 'PICKUP_ORDERS.ERRORS.INVALID_ORDER_ID',
        status: 400
      }));
    }
    if (!otp || otp.trim().length === 0) {
      return throwError(() => ({
        message: 'PICKUP_ORDERS.ERRORS.INVALID_OTP',
        status: 400
      }));
    }

    const body: PickupConfirmation = { order_id: orderId, otp: otp.trim() };
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/transportation/delivery/confirm-pickup-otp`,
      body
    ).pipe(
      timeout(this.HTTP_TIMEOUT_MS),
      catchError(err => this.handleError(err))
    );
  }

  getOrderStatuses(): Observable<OrderStatus[]> {
    // Return cached data if available and not expired
    if (this.statusesCache && this.statusesCacheExpiry > Date.now()) {
      return of(this.statusesCache);
    }

    // Return cached observable if request is already in progress
    if (this.statusesObservableCache) {
      return this.statusesObservableCache;
    }

    // Create and cache the observable for this request
    this.statusesObservableCache = this.http.get<OrderStatus[]>(`${this.apiUrl}/GetWholesalerOrderStatuses`)
      .pipe(
        timeout(this.HTTP_TIMEOUT_MS),
        retryWhen(errors => errors.pipe(
          concatMap((err, idx) => {
            if (idx < this.MAX_RETRIES && this.isRetryableError(err)) {
              const delay = Math.pow(2, idx) * 1000;
              return timer(delay);
            }
            return throwError(() => err);
          })
        )),
        finalize(() => {
          // Clear request cache when request completes
          this.statusesObservableCache = null;
        }),
        catchError(err => {
          // Clear observable cache on error
          this.statusesObservableCache = null;
          return this.handleError(err);
        }),
        shareReplay(1), // Share the observable and replay the last value for new subscribers
      );

    return this.statusesObservableCache;
  }

  /**
   * Determines if an error is retryable (network/timeout errors).
   * Does NOT retry application errors (4xx, 5xx from server).
   * @param error The error to check
   * @returns true if the error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Retry on timeout errors
    if (error.name === 'TimeoutError') {
      return true;
    }

    // Retry on network errors (no response at all)
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return true;
    }

    // Retry on 5xx server errors (server is overloaded or crashed)
    if (error instanceof HttpErrorResponse && error.status >= 500) {
      return true;
    }

    // Do NOT retry on 4xx client errors (bad request, auth, etc.)
    return false;
  }

  /**
   * Cache the order statuses response
   * @param statuses The order statuses to cache
   */
  private cacheOrderStatuses(statuses: OrderStatus[]): void {
    this.statusesCache = statuses;
    this.statusesCacheExpiry = Date.now() + this.CACHE_DURATION_MS;
  }

  /**
   * Clears all cached data from the service.
   * Should be called on user logout to prevent stale data.
   */
  clearCache(): void {
    this.statusesCache = null;
    this.statusesCacheExpiry = 0;
    this.statusesObservableCache = null;
  }

  /**
   * Pre-fetches order statuses for better UX
   * Can be called on app initialization
   */
  prefetchOrderStatuses(): Observable<OrderStatus[]> {
    return this.getOrderStatuses();
  }

  /**
   * Handles HTTP errors and returns user-friendly error messages
   * @param error The HTTP error response
   * @returns An observable that throws an error with a user-friendly message
   */
  private handleError(error: any) {
    let errorMessage = 'PICKUP_ORDERS.ERRORS.GENERIC';
    let status = 0;

    // Handle timeout errors
    if (error.name === 'TimeoutError') {
      errorMessage = 'PICKUP_ORDERS.ERRORS.TIMEOUT';
      status = 0;
      return throwError(() => ({ message: errorMessage, status }));
    }

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = 'PICKUP_ORDERS.ERRORS.NETWORK';
      status = 0;
    } else if (error instanceof HttpErrorResponse) {
      // Backend returned an unsuccessful response code
      status = error.status;

      // Map specific HTTP status codes to appropriate error messages
      switch (error.status) {
        case 0:
          // Network error - no response from server
          errorMessage = 'PICKUP_ORDERS.ERRORS.NETWORK';
          break;
        case 400:
          errorMessage = error.error?.message || 'PICKUP_ORDERS.ERRORS.BAD_REQUEST';
          break;
        case 401:
          errorMessage = 'PICKUP_ORDERS.ERRORS.UNAUTHORIZED';
          break;
        case 403:
          errorMessage = 'PICKUP_ORDERS.ERRORS.FORBIDDEN';
          break;
        case 404:
          errorMessage = 'PICKUP_ORDERS.ERRORS.NOT_FOUND';
          break;
        case 429:
          errorMessage = 'PICKUP_ORDERS.ERRORS.RATE_LIMITED';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage = 'PICKUP_ORDERS.ERRORS.SERVER';
          break;
        default:
          errorMessage = error.error?.message || 'PICKUP_ORDERS.ERRORS.GENERIC';
      }
    } else {
      // Unknown error type
      errorMessage = 'PICKUP_ORDERS.ERRORS.GENERIC';
    }

    return throwError(() => ({ message: errorMessage, status }));
  }
}