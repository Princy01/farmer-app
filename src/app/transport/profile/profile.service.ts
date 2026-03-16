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