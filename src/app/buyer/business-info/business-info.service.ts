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
  private readonly HTTP_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  private applyRetryLogic<T>(observable: Observable<T>): Observable<T> {
    return observable.pipe(
      timeout(this.HTTP_TIMEOUT),
      retry({
        count: this.MAX_RETRIES,
        delay: (error, retryCount) => {
          const delayMs = Math.pow(2, retryCount - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
          return new Promise(resolve => setTimeout(resolve, delayMs));
        },
      })
    );
  }

  getBusinessInfo(): Observable<BusinessInfoAPIResponse> {
    return this.applyRetryLogic(
      this.http.get<BusinessInfoAPIResponse>(
        `${this.apiUrl}/getBusinessInfo`,
        { headers: this.getAuthHeaders() }
      )
    );
  }
}