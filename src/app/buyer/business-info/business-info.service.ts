import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  getBusinessInfo(): Observable<BusinessInfoAPIResponse> {
    return this.http.get<BusinessInfoAPIResponse>(
      `${this.apiUrl}/getBusinessInfo`,
      { headers: this.getAuthHeaders() }
    );
  }

  updateBusiness(payload: UpdateBusinessRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/UpdateBusiness`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  requestEmailChange(newEmail: string): Observable<RequestEmailChangeResponse> {
    return this.http.post<RequestEmailChangeResponse>(
      `${this.apiUrl}/request-email-change`,
      { new_email: newEmail },
      { headers: this.getAuthHeaders() }
    );
  }

  verifyEmailChange(token: string): Observable<VerifyEmailChangeResponse> {
    return this.http.post<VerifyEmailChangeResponse>(
      `${this.apiUrl}/verify-email`,
      { token },
      { headers: this.getAuthHeaders() }
    );
  }
}
