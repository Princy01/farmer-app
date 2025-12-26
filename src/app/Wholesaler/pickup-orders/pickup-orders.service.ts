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

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
      return throwError(() => new Error('Something went wrong. Please try again later.'));
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);

        let errorMessage = 'Something went wrong. Please try again later.';
        if(error.error && error.error.message){
            errorMessage = error.error.message;
        }

      return throwError(() => new Error(errorMessage));
    }
  }
}