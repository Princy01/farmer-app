import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface ForSaleOrder {
  item: string;
  spinach_quality: string;
  order_wastage: string;
  quantity: number;
  price: number;
  datetime: string;
  pickup_location: string;
}

@Injectable({
  providedIn: 'root'
})
export class Screen3Service {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  createOrder(order: ForSaleOrder): Observable<any> {
    return this.http.post(`${this.apiUrl}/createOrder`, order)
      .pipe(take(1), catchError(this.handleError));
  }

  updateOrder(order: ForSaleOrder): Observable<any> {
    return this.http.put(`${this.apiUrl}/updateOrder`, order)
      .pipe(catchError(this.handleError));
  }

  deleteOrder(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteOrder/${id}`)
      .pipe(catchError(this.handleError));
  }

  getOrders(): Observable<ForSaleOrder[]> {
    return this.http.get<ForSaleOrder[]>(`${this.apiUrl}/orders`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
      return throwError(() => new Error('Something went wrong. Please try again later.'));
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`
      );

      let errorMessage = 'Something went wrong. Please try again later.';
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }

      return throwError(() => new Error(errorMessage));
    }
  }
}
