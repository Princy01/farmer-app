import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// mandi.model.ts
export interface Mandi {
  id: number;
  mandi_location: string;
  mandi_number: string;
  mandi_incharge: string;
  mandi_incharge_num: string;
  mandi_pincode: string;
  mandi_address: string;
  remarks: string;
  mandi_city: number;
  mandi_state: number;
}


@Injectable({
  providedIn: 'root'
})
export class MandiService {
  private apiUrl = 'http://127.0.0.1:3000';

  constructor(private http: HttpClient) { }

  createMandi(mandi: Mandi): Observable<any> {
    return this.http.post(`${this.apiUrl}/mandiDetails`, mandi)
      .pipe(catchError(this.handleError));
  }

  updateMandi(mandi: Mandi): Observable<any> {
    return this.http.put(`${this.apiUrl}/mandiUpdate`, mandi)
      .pipe(catchError(this.handleError));
  }

  deleteMandi(id: number): Observable<any> { 
    return this.http.delete(`${this.apiUrl}/mandiDelete/${id}`)
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