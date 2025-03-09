import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// user-bank-detail.model.ts
export interface UserBankDetail {
  id: number;
  user_id: number;
  card_number: string;
  upi_id: string;
  ifsc_code: string;
  account_number: string;
  account_holder_name: string;
  bank_name: string;
  branch_name: string;
  status: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserBankDetailService {
  private apiUrl = 'http://127.0.0.1:3000';

  constructor(private http: HttpClient) { }

  createUserBankDetail(bankDetail: UserBankDetail): Observable<any> {
    return this.http.post(`${this.apiUrl}/user-bank-details`, bankDetail)
      .pipe(catchError(this.handleError));
  }

  updateUserBankDetail(bankDetail: UserBankDetail): Observable<any> {
    return this.http.put(`${this.apiUrl}/user-bank-details`, bankDetail)
      .pipe(catchError(this.handleError));
  }

  deleteUserBankDetail(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/user-bank-details/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    // ... (same error handling logic as in UserService)
    if (error.error instanceof ErrorEvent) {
        // Client-side error
        console.error('An error occurred:', error.error.message);
        return throwError(() => new Error('Something went wrong. Please try again later.')); // More user-friendly message
      } else {
        // Server-side error
        console.error(
          `Backend returned code ${error.status}, ` +
          `body was: ${error.error}`);

          // Extract error message from backend if available.
          let errorMessage = 'Something went wrong. Please try again later.';
          if(error.error && error.error.message){
              errorMessage = error.error.message;
          }

        return throwError(
          () => new Error(errorMessage) // Or provide more specific error details
        );
      }
  }
}