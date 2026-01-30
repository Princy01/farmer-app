import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  date_of_order: string; // ISO date string
  order_status_id: number;
  order_status: string;
  retailer_id: number;
  total_items: number;
  total_quantity: number;
  total_order_amount: number;
  final_amount: number;
  delivery_address: string;
  actual_delivery_date?: string;
  created_at: string;
  updated_at: string;
}

export interface WholesalerOrderDetails {
  order_id: number;
  date_of_order: string;
  order_status_id: number;
  order_status: string;
  retailer_id: number;
  total_order_amount: number;
  final_amount: number;
  delivery_address: string;
  actual_delivery_date?: string;
  created_at: string;
  updated_at: string;
  items: WholesalerOrderItem[];
}

export interface PickupOTP {
  order_id: number;
  user_id: number;
  otp_code: string;
  expires_at: string; // ISO date string
  is_used?: boolean;
  used_at?: string;
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

  constructor(private http: HttpClient) { }

  getWholesalerOrders(status?: number[]): Observable<WholesalerOrderSummary[]> {
    let params = new HttpParams();
    if (status && status.length > 0) {
      params = params.set('status', status.join(','));
    }
    return this.http.get<WholesalerOrderSummary[]>(`${this.apiUrl}/GetWholesalerOrders`, { params })
      .pipe(catchError(this.handleError));
  }

  getWholesalerOrderDetails(id: number): Observable<WholesalerOrderDetails> {
    return this.http.get<WholesalerOrderDetails>(`${this.apiUrl}/GetWholesalerOrders/${id}`)
      .pipe(catchError(this.handleError));
  }

  generatePickupOtp(orderId: number): Observable<PickupOTP> {
    return this.http.post<PickupOTP>(`${this.apiUrl}/transportation/delivery/generate-pickup-otp`, { order_id: orderId })
      .pipe(catchError(this.handleError));
  }

  getOrderStatuses(): Observable<OrderStatus[]> {
    return this.http.get<OrderStatus[]>(`${this.apiUrl}/GetWholesalerOrderStatuses`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Handles HTTP errors and returns user-friendly error messages
   * @param error The HTTP error response
   * @returns An observable that throws an error with a user-friendly message
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'PICKUP_ORDERS.ERRORS.GENERIC';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      console.error('Client error occurred:', error.error.message);
      errorMessage = 'PICKUP_ORDERS.ERRORS.NETWORK';
    } else {
      // Backend returned an unsuccessful response code
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was:`, error.error
      );

      // Map specific HTTP status codes to appropriate error messages
      switch (error.status) {
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
        case 500:
          errorMessage = 'PICKUP_ORDERS.ERRORS.SERVER';
          break;
        default:
          errorMessage = error.error?.message || 'PICKUP_ORDERS.ERRORS.GENERIC';
      }
    }

    return throwError(() => ({ message: errorMessage, status: error.status }));
  }
}