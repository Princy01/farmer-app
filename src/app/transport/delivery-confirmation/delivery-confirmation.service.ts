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
}

export interface GenerateOTPResponse {
  job_id: number;
  otp_code: string;
  expires_at: string;
  retailer_id: number;
}

export interface ConfirmDeliveryRequest {
  job_id: number;
  otp: string;
}

export interface ActiveJob {
  assignment_id: number;
  job_id: number;
  pickup_location: string;
  dropoff_location: string;
  delivery_date: string; // ISO string from time.Time
  base_price: number;
  weight: number;
  distance: number;
  job_status: string;
  accepted_at?: string; // ISO string or null
  pickup_confirmed_at?: string; // ISO string or null
  delivery_status: string;
}

export interface JobOrder {
  order_id: number;
  date_of_order: string; // ISO string from time.Time
  delivery_address: string;
  total_order_amount: number;
  final_amount: number;
  order_status_id: number;
  order_status_text: string;
  actual_delivery_date?: string; // ISO string or null
  retailer_id: number;
  retailer_owner?: string;
  retailer_contact?: string;
  retailer_email?: string;
  wholeseller_ids: number[];
  products: any; // Raw JSON array from backend; will be parsed to DeliveryItem[]
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

  getActiveDeliveryJobs(): Observable<ActiveJob[]> {
    return this.http.get<ActiveJob[]>(
      `${this.apiUrl}/transportation/delivery/active-delivery-jobs`,
      { headers: this.getHeaders() }
    );
  }

  getOrdersInJob(jobId: number): Observable<JobOrder[]> {
    return this.http.get<JobOrder[]>(
      `${this.apiUrl}/transportation/delivery/job-orders/${jobId}`,
      { headers: this.getHeaders() }
    );
  }

  generateOTP(request: GenerateOTPRequest): Observable<GenerateOTPResponse> {
    return this.http.post<GenerateOTPResponse>(
      `${this.apiUrl}/transportation/delivery/generate-delivery-otp`,
      request,
      { headers: this.getHeaders() }
    );
  }

  confirmDelivery(request: ConfirmDeliveryRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/transportation/delivery/confirm-delivery`,
      request,
      { headers: this.getHeaders() }
    );
  }
}