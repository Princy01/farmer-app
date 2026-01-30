import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../auth/auth.service';

export interface Business {
  bid?: number;
  email: string;
  mobile_number: string;
  address: string;
  is_active: boolean;
  user_id?: number;
}

export interface BusinessUpdateRequest {
  email: string;
  mobile_number: string;
  address: string;
  is_active: boolean;
}

export interface BusinessUpdateResponse {
  message: string;
  business?: Business;
}

@Injectable({
  providedIn: 'root'
})
export class BusinessUpdateService {
  private readonly apiUrl = environment.apiUrl;
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  updateBusiness(businessData: BusinessUpdateRequest): Observable<BusinessUpdateResponse> {
    const headers = this.getAuthHeaders();

    return this.http.post<BusinessUpdateResponse>(
      `${this.apiUrl}/UpdateBusiness`,
      businessData,
      { headers }
    ).pipe(
      timeout(this.REQUEST_TIMEOUT),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      console.error('Client-side error:', error.error.message);
      errorMessage = 'Network error. Please check your connection.';
    } else {
      // Backend error
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${JSON.stringify(error.error)}`
      );

      if (error.status === 0) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (error.status === 404) {
        errorMessage = 'Business not found.';
      } else if (error.status === 422) {
        errorMessage = error.error?.error || 'Invalid data provided.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      }
    }

    return throwError(() => ({
      status: error.status,
      message: errorMessage,
      originalError: error
    }));
  }
}