import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface OrderItem {
  product_id: number;
  quantity: number;
  unit_id: number;
  price: number;
  discount_amount: number;
  tax_amount: number;
  wholeseller_id: number;
  product_name?: string;
  image_url?: string;
}

export interface RetailerOrderDetails {
  order_id: number;
  date_of_order: string;
  order_status: number | null;
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

@Injectable({
  providedIn: 'root'
})
export class RetailerOrderService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getOrderDetails(orderId: number): Observable<RetailerOrderDetails> {
    return this.http.get<RetailerOrderDetails>(`${this.apiUrl}/getRetailerOrderDetails/${orderId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while fetching order details';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}