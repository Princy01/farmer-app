// filepath: c:\Users\princ\IONIC_PROJECTS\farmer-app-standalone-master\src\app\Wholesaler\settings\settings.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, timeout, retryWhen, concatMap, finalize } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface UserSettings {
  orderUpdates: boolean;
  priceAlerts: boolean;
  stockAlerts: boolean;
  marketingEmails: boolean;
  smsNotifications: boolean;
  autoRefresh: boolean;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface DeleteAccountRequest {
  password: string;
  confirmation: string;
}

@Injectable({
  providedIn: 'root'
})
export class WholesalerSettingsService {
  private apiUrl = environment.apiUrl + '/wholesaler';
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Applies timeout and retry logic with exponential backoff to observable
   * @param isRetryable Whether to apply retry logic (false for POST/DELETE/PUT)
   */
  private applyRequestPipeline<T>(observable: Observable<T>, isRetryable: boolean = true): Observable<T> {
    let pipeline = observable.pipe(timeout(this.REQUEST_TIMEOUT));

    if (isRetryable) {
      pipeline = pipeline.pipe(
        retryWhen(errors =>
          errors.pipe(
            concatMap((err, idx) => {
              if (idx < this.MAX_RETRIES && this.isRetryableError(err)) {
                const delay = Math.pow(2, idx) * 1000; // 1s, 2s, 4s
                return timer(delay);
              }
              return throwError(() => err);
            })
          )
        )
      );
    }

    return pipeline.pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Determines if an error is retryable (network, timeout, 5xx errors)
   */
  private isRetryableError(error: any): boolean {
    if (error.name === 'TimeoutError') return true;
    if (error.status >= 500) return true;
    if (error.status === 0) return true; // Network error
    return false;
  }

  getSettings(): Observable<UserSettings> {
    const headers = this.getAuthHeaders();
    return this.applyRequestPipeline(
      this.http.get<UserSettings>(`${this.apiUrl}/settings`, { headers }),
      true // Retry on network/timeout errors
    );
  }

  updateSettings(settings: UserSettings): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.applyRequestPipeline(
      this.http.put(`${this.apiUrl}/settings`, settings, { headers }),
      true // Retry on network/timeout errors
    );
  }

  changePassword(data: UpdatePasswordRequest): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.applyRequestPipeline(
      this.http.put(`${this.apiUrl}/settings/password`, data, { headers }),
      true // Retry on network/timeout errors
    );
  }

  deleteAccount(data: DeleteAccountRequest): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.applyRequestPipeline(
      this.http.delete(`${this.apiUrl}/account`, { headers, body: data }),
      false // Don't retry on destructive operations
    );
  }

  private handleError(error: HttpErrorResponse | any): Observable<never> {
    let errorMessage = 'SETTINGS.ERROR_OCCURRED';

    // Handle timeout errors
    if (error.name === 'TimeoutError') {
      errorMessage = 'SETTINGS.REQUEST_TIMEOUT_ERROR';
    }
    // Handle network errors
    else if (error.status === 0) {
      errorMessage = 'SETTINGS.NETWORK_ERROR';
    }
    // Handle 401 Unauthorized
    else if (error.status === 401) {
      errorMessage = 'SETTINGS.AUTH_ERROR';
    }
    // Handle 403 Forbidden
    else if (error.status === 403) {
      errorMessage = 'SETTINGS.PERMISSION_ERROR';
    }
    // Handle 404 Not Found
    else if (error.status === 404) {
      errorMessage = 'SETTINGS.NOT_FOUND_ERROR';
    }
    // Handle 429 Rate Limited
    else if (error.status === 429) {
      errorMessage = 'SETTINGS.RATE_LIMIT_ERROR';
    }
    // Handle 5xx Server Errors
    else if (error.status >= 500) {
      errorMessage = 'SETTINGS.SERVER_ERROR';
    }
    // Handle backend error message
    else if (error.error && typeof error.error === 'object' && error.error.error) {
      errorMessage = error.error.error;
    }

    return throwError(() => new Error(errorMessage));
  }
}