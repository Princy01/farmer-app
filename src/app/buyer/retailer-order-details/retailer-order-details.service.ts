import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { OrderPostDeliveryStatus } from 'src/app/shared/order-post-delivery-status';

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
  delivery_amount: number;
  final_amount: number;
  items: OrderItem[];
  transport?: OrderTransportStatus | null;
  post_delivery?: OrderPostDeliveryStatus | null;
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

export interface CancelRetailerOrderResponse {
  status: string;
  message: string;
}

export interface ReturnReason {
  reason_id: number;
  reason_code: string;
  reason_description: string;
  reason_category: string;
}

export interface ReturnItem {
  product_id: number;
  quantity: number;
  unit: string;
}

export interface CreateReturnRequest {
  order_id: number;
  wholeseller_id: number;
  return_reason_id: number;
  items: ReturnItem[];
  remarks?: string;
}

export interface CreateReturnResponse {
  message: string;
  return_id: number;
  dispute_case_id?: number;
  return_window_expires_at?: string;
}

export interface ReturnEvidenceUploadResponse {
  file_url: string;
  message: string;
}

export interface ReturnEvidenceListResponse {
  evidence_urls: string[];
}

interface DisputeEvidenceItem {
  file_url?: string;
}

interface DisputeEvidenceListApiResponse {
  items?: DisputeEvidenceItem[];
}

export interface ReturnEvidenceUploadOptions {
  caption?: string;
  capturedAt?: string;
}

export interface ReturnDispute {
  dispute_id: number;
  return_id: number;
  wholeseller_id: number;
  dispute_status: string;
  created_at: string;
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

  constructor(private http: HttpClient) { }

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
          // Do not retry client errors (4xx) — they will not resolve on retry
          if (error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500) {
            return throwError(() => error);
          }
          const delayMs = Math.pow(2, retryCount - 1) * 1000;
          return new Promise<void>(resolve => setTimeout(() => resolve(), delayMs));
        }
      }),
      catchError((error: HttpErrorResponse | TimeoutError) => this.handleError(error))
    );
  }

  /**
   * Fetches return reasons from the backend.
   * @param category Optional category filter (retailer | logistics | system)
   * @returns Observable of return reasons array
   */
  getReturnReasons(category?: string): Observable<ReturnReason[]> {
    let url = `${this.apiUrl}/returns/reasons`;
    if (category) {
      url += `?category=${category}`;
    }
    return this.http.get<ReturnReason[]>(url).pipe(
      timeout(this.HTTP_TIMEOUT),
      retry({
        count: 2,
        delay: (error, retryCount) => {
          if (error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500) {
            return throwError(() => error);
          }
          const delayMs = Math.pow(2, retryCount - 1) * 1000;
          return new Promise<void>(resolve => setTimeout(() => resolve(), delayMs));
        }
      }),
      catchError((error: HttpErrorResponse | TimeoutError) => this.handleError(error))
    );
  }

  /**
   * Creates a return request for an order.
   * @param returnRequest The return request containing order, items, and reason details
   * @returns Observable of return response with return_id
   */
  createReturnRequest(returnRequest: CreateReturnRequest): Observable<CreateReturnResponse> {
    return this.http.post<CreateReturnResponse>(
      `${this.apiUrl}/returns/request`,
      {
        order_id: returnRequest.order_id,
        wholeseller_id: returnRequest.wholeseller_id,
        return_reason_id: returnRequest.return_reason_id,
        items: returnRequest.items,
        remarks: returnRequest.remarks || ''
      }
    ).pipe(
      timeout(this.HTTP_TIMEOUT),
      retry({
        count: 2,
        delay: (error, retryCount) => {
          if (error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500) {
            return throwError(() => error);
          }
          const delayMs = Math.pow(2, retryCount - 1) * 1000;
          return new Promise<void>(resolve => setTimeout(() => resolve(), delayMs));
        }
      }),
      catchError((error: HttpErrorResponse | TimeoutError) => this.handleError(error))
    );
  }

  /**
   * Adds evidence to an existing return dispute.
   * @param disputeId The ID of the return dispute
   * @param image The image file to upload
   * @returns Observable of upload response with file_url
   */
  addReturnDisputeEvidence(
    disputeId: number,
    image: File,
    options: ReturnEvidenceUploadOptions = {}
  ): Observable<ReturnEvidenceUploadResponse> {
    const formData = new FormData();
    formData.append('image', image, image.name);
    formData.append('capture_source', 'camera');
    if (options.caption) {
      formData.append('caption', options.caption);
    }
    if (options.capturedAt) {
      formData.append('captured_at', options.capturedAt);
    }

    return this.http.post<ReturnEvidenceUploadResponse>(
      `${this.apiUrl}/disputes/${disputeId}/evidence`,
      formData
    ).pipe(
      map((response) => ({
        ...response,
        file_url: this.toAbsoluteApiUrl(response.file_url)
      })),
      timeout(this.HTTP_TIMEOUT),
      retry({
        count: 2,
        delay: (error, retryCount) => {
          if (error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500) {
            return throwError(() => error);
          }
          const delayMs = Math.pow(2, retryCount - 1) * 1000;
          return new Promise<void>(resolve => setTimeout(() => resolve(), delayMs));
        }
      }),
      catchError((error: HttpErrorResponse | TimeoutError) => this.handleError(error))
    );
  }

  getReturnDisputeEvidence(disputeId: number): Observable<ReturnEvidenceListResponse> {
    return this.http.get<DisputeEvidenceListApiResponse>(
      `${this.apiUrl}/disputes/${disputeId}/evidence`
    ).pipe(
      map((response) => ({
        evidence_urls: (response.items || [])
          .map((item) => item.file_url)
          .filter((url): url is string => !!url)
          .map((url) => this.toAbsoluteApiUrl(url))
      })),
      timeout(this.HTTP_TIMEOUT),
      retry({
        count: 2,
        delay: (error, retryCount) => {
          if (error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500) {
            return throwError(() => error);
          }
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

  private toAbsoluteApiUrl(url: string): string {
    if (!url || /^https?:\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    return `${this.apiUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  }
}
