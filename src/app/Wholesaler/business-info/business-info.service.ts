import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface BusinessInfo {
  b_registration_num: string;
  b_owner_name: string;
  b_category_name: string;
  b_type_name: string;
  established_year: string;
  state_name: string;
  city_name: string;
  location_name: string;
  address: string;
  mobile_number: string;
  email: string;
  gst_number: string;
  pan_number: string;
}

export interface BusinessInfoAPIResponse {
  status: string;
  data: BusinessInfo;
}

export interface UpdateBusinessRequest {
  address: string;
  gst_number: string;
}

export interface RequestEmailChangeResponse {
  message: string;
  verification_sent: boolean;
  verification_token: string;
}

export interface VerifyEmailChangeResponse {
  message: string;
  verified: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BusinessInfoService {
  private apiUrl = environment.apiUrl;
  private readonly HTTP_TIMEOUT_MS = 30000; // 30 seconds
  private readonly RETRY_COUNT = 3;
  private readonly RETRY_DELAY_MS = 1000; // Exponential backoff: 1s, 2s, 4s

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Fetch business information with retry logic and timeout
   * @returns Observable of business info response
   */
  getBusinessInfo(): Observable<BusinessInfoAPIResponse> {
    return this.http.get<BusinessInfoAPIResponse>(
      `${this.apiUrl}/getBusinessInfo`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(this.HTTP_TIMEOUT_MS),
      retry({
        count: this.RETRY_COUNT,
        delay: (error: any, retryCount: number) => {
          const delayMs = this.RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
          return new Observable(subscriber => {
            setTimeout(() => subscriber.complete(), delayMs);
          });
        }
      })
    );
  }

  /**
   * Update business info with retry logic and timeout
   * @param payload Business update data
   * @returns Observable of response
   */
  updateBusiness(payload: UpdateBusinessRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/UpdateBusiness`,
      payload,
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(this.HTTP_TIMEOUT_MS),
      retry({
        count: this.RETRY_COUNT,
        delay: (error: any, retryCount: number) => {
          const delayMs = this.RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
          return new Observable(subscriber => {
            setTimeout(() => subscriber.complete(), delayMs);
          });
        }
      })
    );
  }

  /**
   * Request email change verification with retry logic and timeout
   * @param newEmail New email address
   * @returns Observable of response
   */
  requestEmailChange(newEmail: string): Observable<RequestEmailChangeResponse> {
    return this.http.post<RequestEmailChangeResponse>(
      `${this.apiUrl}/auth/request-email-change`,
      { new_email: newEmail },
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(this.HTTP_TIMEOUT_MS),
      retry({
        count: this.RETRY_COUNT,
        delay: (error: any, retryCount: number) => {
          const delayMs = this.RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
          return new Observable(subscriber => {
            setTimeout(() => subscriber.complete(), delayMs);
          });
        }
      })
    );
  }

  /**
   * Verify email change with retry logic and timeout
   * @param token Verification token from email
   * @returns Observable of response
   */
  verifyEmailChange(token: string): Observable<VerifyEmailChangeResponse> {
    return this.http.post<VerifyEmailChangeResponse>(
      `${this.apiUrl}/verify-email`,
      { token },
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(this.HTTP_TIMEOUT_MS),
      retry({
        count: this.RETRY_COUNT,
        delay: (error: any, retryCount: number) => {
          const delayMs = this.RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
          return new Observable(subscriber => {
            setTimeout(() => subscriber.complete(), delayMs);
          });
        }
      })
    );
  }
}