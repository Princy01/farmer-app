import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface RetailerOrderHistory {
  order_id: number;
  date_of_order: string;
  order_status: number | null;
  delivery_address: string;
  total_order_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  actual_delivery_date?: string | null;
}

export interface RetailerOrderHistoryResponse {
  current_orders: RetailerOrderHistory[];
  order_history: RetailerOrderHistory[];
}

@Injectable({
  providedIn: 'root'
})
export class RetailerOrderHistoryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getOrderHistory(): Observable<RetailerOrderHistoryResponse> {
    return this.http.get<RetailerOrderHistoryResponse>(`${this.apiUrl}/order_history`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while fetching order history';

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