import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface BusinessBranch {
  branch_id: number;
  bid: number;
  shop_name: string;
  type_id: number;
  location_id: number;
  location_name: string;
  state_id: number;
  state_name: string;
  state_shortname: string;
  city_id: number;
  city_name: string;
  city_shortname: string;
  address: string;
  email: string;
  number: string;
  gst_num: string;
  pan_num: string;
  privilege_user: boolean;
  established_year: string;
  created_at: string;
  updated_at: string;
  active_status: boolean;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;

      if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }

    console.error('CheckoutService Error:', errorMessage);
    return throwError(() => error);
  }

  getAllBusinessBranches(): Observable<BusinessBranch[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<BusinessBranch[]>(
      `${this.apiUrl}/getAllBusinessBranchesWithNamesByUser`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }
}