import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface DriverProfile {
  first_name: string;
  last_name: string;
  dob: string;
  licence_no: string;
  licence_type: string;
  licence_issued_date: string;
  licence_expiry_date: string;
  contact_num: string;
  contact_num_addl: string | null;
  email: string | null;
  aadhar: string;
  pan: string;
  address_door_no: string;
  address_street: string;
  address_state: string;
  address_town: string;
  address_pin_code: string;
  address_landmark: string;
  bank_ac_no: string;
  bank_name: string;
  bank_branch: string;
  ifsc: string;
  bank_address: string;
  veh_number: string | null;
  reg_date: string | null;
  vehicle_state: string | null;
  type_id: number | null;
  load_capacity: number | null;
  fuel_type: string | null;
  profile_image: string | null;
  active_status: boolean;
  total_deliveries: number;
  registration_date: string | null;
}

export interface UpdateDriverProfileRequest {
  address_door_no?: string | null;
  address_street?: string | null;
  address_pin_code?: string | null;
  address_landmark?: string | null;
  bank_ac_no?: string | null;
  bank_name?: string | null;
  bank_branch?: string | null;
  ifsc?: string | null;
  bank_address?: string | null;
}

export interface UploadProfileImageRequest {
  image: string; // base64 encoded string
}

/**
 * Request body for the driver email-change endpoint.
 * `new_email` is nullable — send null (or omit) when the driver has no existing email
 * and is adding one for the first time, or send an empty string to clear it.
 * The backend accepts: { "new_email": "user@example.com" } | { "new_email": null }
 */
export interface RequestDriverEmailChangeRequest {
  new_email: string | null;
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
  providedIn: 'root'
})
export class DriverProfileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getDriverProfile(): Observable<DriverProfile> {
    const headers = this.getAuthHeaders();
    return this.http.get<DriverProfile>(`${this.apiUrl}/driver/profile`, { headers });
  }

  updateDriverProfile(data: UpdateDriverProfileRequest): Observable<{ message: string }> {
    const headers = this.getAuthHeaders();
    return this.http.put<{ message: string }>(`${this.apiUrl}/driver/profile`, data, { headers });
  }

  uploadProfileImage(data: UploadProfileImageRequest): Observable<{ message: string }> {
    const headers = this.getAuthHeaders();
    return this.http.post<{ message: string }>(`${this.apiUrl}/driver/profile/image`, data, { headers });
  }

  /**
   * Requests a driver email change.
   * Posts to POST /auth/request-driver-email-change (requires Bearer token).
   * The backend validates the email, invalidates old email_change_driver tokens,
   * generates a new JWT verification token, stores its hash, and sends the
   * verification email to the new address.
   *
   * @param newEmail - The new email address, or null if the driver has no email yet.
   */
  requestDriverEmailChange(newEmail: string | null): Observable<RequestEmailChangeResponse> {
    const body: RequestDriverEmailChangeRequest = { new_email: newEmail };
    return this.http.post<RequestEmailChangeResponse>(
      `${this.apiUrl}/auth/request-driver-email-change`,
      body,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Verifies the email-change token clicked from the driver's inbox.
   * The backend's VerifyEmail handler resolves the token type internally:
   * - "email_change_driver" → updates the driver's email via UpdateDriverEmail()
   * No token-type parameter is needed from the client side.
   *
   * @param token - The JWT token extracted from the verification link query param.
   */
  verifyEmailChange(token: string): Observable<VerifyEmailChangeResponse> {
    return this.http.post<VerifyEmailChangeResponse>(
      `${this.apiUrl}/verify-email`,
      { token },
      { headers: this.getAuthHeaders() }
    );
  }
}