import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer, timeout } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';
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
  location_verification_status?: string;
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
    return throwError(() => error);
  }

  private validateBusinessBranches(data: any): data is BusinessBranch[] {
    if (!Array.isArray(data)) {
      return false;
    }
    return data.every(item =>
      typeof item === 'object' &&
      item !== null &&
      'branch_id' in item
    );
  }

  getAllBusinessBranches(): Observable<BusinessBranch[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<BusinessBranch[]>(
      `${this.apiUrl}/getAllBusinessBranchesWithNamesByUser`,
      { headers }
    ).pipe(
      timeout(30000), // 30 second timeout
      map(response => {
        if (!this.validateBusinessBranches(response)) {
          throw new Error('Invalid business branches response format');
        }
        return response;
      }),
      retry({
        count: 3,
        delay: (error, retryCount) => {
          // Exponential backoff: 1s, 2s, 4s
          const delayMs = Math.pow(2, retryCount) * 1000;
          return timer(delayMs);
        }
      }),
      catchError(this.handleError)
    );
  }
}
