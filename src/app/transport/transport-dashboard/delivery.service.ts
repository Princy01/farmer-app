import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer, TimeoutError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private apiUrl = environment.apiUrl;
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY_MS = 1000; // 1 second
  private readonly REQUEST_TIMEOUT_MS = 30000; // 30 seconds

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getActiveDeliveries(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/transportation/delivery/active-deliveries`, { headers })
      .pipe(
        timeout(this.REQUEST_TIMEOUT_MS),
        retry({
          count: this.MAX_RETRIES,
          delay: (error, retryCount) => {
            const delayMs = this.INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
            return timer(delayMs);
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  getUpcomingDeliveries(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/transportation/delivery/upcoming-deliveries`, { headers })
      .pipe(
        timeout(this.REQUEST_TIMEOUT_MS),
        retry({
          count: this.MAX_RETRIES,
          delay: (error, retryCount) => {
            const delayMs = this.INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
            return timer(delayMs);
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  getCompletedDeliveries(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/transportation/delivery/completed-deliveries`, { headers })
      .pipe(
        timeout(this.REQUEST_TIMEOUT_MS),
        retry({
          count: this.MAX_RETRIES,
          delay: (error, retryCount) => {
            const delayMs = this.INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
            return timer(delayMs);
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  cancelDeliveryJob(jobId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/transportation/delivery/cancel-job/${jobId}`, {}, { headers })
      .pipe(
        timeout(this.REQUEST_TIMEOUT_MS),
        catchError(this.handleError.bind(this))
      );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'TRANSPORT_DASHBOARD.LOAD_DELIVERIES_ERROR';

    // Handle timeout errors from RxJS timeout operator
    if (error instanceof TimeoutError) {
      errorMessage = 'WHOLESALER_HOME.REQUEST_TIMEOUT_ERROR';
    } else if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 0:
          errorMessage = 'WHOLESALER_HOME.NETWORK_ERROR';
          break;
        case 408:
        case 504:
          errorMessage = 'WHOLESALER_HOME.REQUEST_TIMEOUT_ERROR';
          break;
        case 401:
          errorMessage = 'WHOLESALER_HOME.AUTH_ERROR';
          break;
        case 403:
          errorMessage = 'WHOLESALER_HOME.ACCESS_DENIED';
          break;
        case 404:
          errorMessage = 'WHOLESALER_HOME.NOT_FOUND';
          break;
        case 429:
          errorMessage = 'WHOLESALER_HOME.RATE_LIMIT_ERROR';
          break;
        case 500:
        case 502:
        case 503:
          errorMessage = 'WHOLESALER_HOME.SERVER_ERROR';
          break;
        default:
          errorMessage = 'WHOLESALER_HOME.UNEXPECTED_ERROR';
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}