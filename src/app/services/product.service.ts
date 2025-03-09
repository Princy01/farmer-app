import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// product.model.ts
export interface Product {
  product_id: number;
  category_id: number;
  product_name: string;
  status: number; // Or boolean
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://127.0.0.1:3000';

  constructor(private http: HttpClient) { }

  createProduct(product: Product): Observable<any> { // Or Observable<Product>
    return this.http.post(`${this.apiUrl}/productDetails`, product)
      .pipe(catchError(this.handleError));
  }

  updateProduct(product: Product): Observable<any> { // Or Observable<Product>
    return this.http.put(`${this.apiUrl}/productUpdate`, product)
      .pipe(catchError(this.handleError));
  }

  deleteProduct(id: number): Observable<any> { // Or Observable<void>
    return this.http.delete(`${this.apiUrl}/productDelete/${id}`)
      .pipe(catchError(this.handleError));
  }

  getCategories(): Observable<Product[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getCategories`)
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