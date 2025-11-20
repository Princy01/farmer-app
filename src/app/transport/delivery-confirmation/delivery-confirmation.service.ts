import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface DeliveryDetails {
  job_id: number;
  order_id: number;
  retailer_name: string;
  retailer_phone: string;
  delivery_address: string;
  items: DeliveryItem[];
  assigned_driver_id: number; // To validate assignment
}

export interface DeliveryItem {
  id: string;
  name: string;
  quantity: number;
  weight: string;
  qrCode: string;
  unit: string;
  pickupCondition: 'good' | 'damaged' | 'not_checked';
}

export interface GenerateOTPRequest {
  job_id: number;
  order_id: number;
}

export interface GenerateOTPResponse {
  otp_code: string;
  retailer_id: number;
  expires_at: string; // Assuming backend returns expiry
}

export interface ConfirmDeliveryRequest {
  job_id: number;
  order_id: number;
  otp: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  
//Add a backend endpoint for getDeliveryDetails
  // Fetch delivery details and validate assignment
  getDeliveryDetails(jobId: number, orderId: number): Observable<DeliveryDetails> {
    return this.http.get<DeliveryDetails>(
      `${this.apiUrl}/delivery/details?job_id=${jobId}&order_id=${orderId}`,
      { headers: this.getHeaders() }
    );
  }

  // Generate OTP via backend
  generateOTP(request: GenerateOTPRequest): Observable<GenerateOTPResponse> {
    return this.http.post<GenerateOTPResponse>(
      `${this.apiUrl}/generate-otp`,
      request,
      { headers: this.getHeaders() }
    );
  }

  // Confirm delivery via backend
  confirmDelivery(request: ConfirmDeliveryRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/confirm-delivery`,
      request,
      { headers: this.getHeaders() }
    );
  }
}