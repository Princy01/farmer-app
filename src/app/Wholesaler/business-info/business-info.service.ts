import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface BusinessInfo {
  b_registration_num: string;
  pan_number: string;
  aadhaar_number: string;
  government_license_number: string;
}

export interface BusinessInfoAPIResponse {
  status: string;
  data: BusinessInfo;
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
}