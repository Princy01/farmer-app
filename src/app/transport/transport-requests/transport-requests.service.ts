import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface Product {
  product_id: number;
  product_name: string;
  image_path: string;
  category_id: number;
  active_status: number;
  nutrition_factor: string;
  img_code: string;
}

export interface Branch {
  branch_id?: number;
  branch_name?: string;
  branch_address?: string;
  branch_number?: string;
}

export interface OrderItem {
  order_item_id: number;
  quantity: number;
  unit_id: number;
  discount_amount: number;
  tax_amount: number;
  max_item_price: number;
  wholeseller_price: number;
  agreed_quantity: number;
  product: Product;
  branch?: Branch;
}

export interface Order {
  order_id: number;
  date_of_order: string;
  order_status: number;
  total_order_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  delivery_address: string;
  actual_delivery_date?: string;
  cancellation_reason?: string;
  cancelled_by_user_id: number;
  retailer_branch: Branch;
  items: OrderItem[];
}

export interface DriverJobOffer {
  ride_id: number;
  job_id: number;
  attempt_no: number;
  driver_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  accepted_at?: string;
  rejected_at?: string;
  removed_at?: string;
  pickup_address: string;
  drop_address: string;
  load_weight_kg: number;
  offered_rate: number;
  city: string;
  area: string;
  capacity_warning: boolean;
  authorized_capacity_kg?: number;
  current_load_kg?: number;
  projected_load_kg?: number;
  overload_kg?: number;
}

export interface AcceptJobRequest {
  attempt_no: number;
}

export interface RejectJobRequest {
  attempt_no: number;
}

export interface DriverStatusResponse {
  driver_id: number;
  status: string; // 'active' | 'inactive'
}

export interface DriverOnboardingStatusResponse {
  driver_id: number;
  onboarding_verification_status: string;
  registration_complete: boolean;
  can_act_on_live_jobs: boolean;
  verification_notes?: string;
}

export interface UpdateDriverStatusRequest {
  status: string; // 'active' | 'inactive'
}

@Injectable({
  providedIn: 'root'
})
export class TransportRequestService {
  private apiUrl = environment.apiUrl;
  private realtimeApiUrl = environment.realtimeApiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getOpenJobs(): Observable<DriverJobOffer[]> {
    const headers = this.getAuthHeaders();
    const url = `${this.realtimeApiUrl}/api/driver/jobs/open`;
    return this.http.get<DriverJobOffer[]>(url, { headers });
  }

  getTransportRequestDetailed(cityIds: number[], branchIds: number[]): Observable<DriverJobOffer[]> {
    const headers = this.getAuthHeaders();
    let params = new URLSearchParams();

    if (cityIds && cityIds.length > 0) {
      params.append('city_ids', cityIds.join(','));
    }

    if (branchIds && branchIds.length > 0) {
      params.append('branch_ids', branchIds.join(','));
    }

    const url = `${this.realtimeApiUrl}/api/driver/jobs/open${params.toString() ? '?' + params.toString() : ''}`;
    return this.http.get<DriverJobOffer[]>(url, { headers });
  }

  acceptJob(rideId: number, attemptNo: number): Observable<any> {
    const headers = this.getAuthHeaders();
    const body: AcceptJobRequest = { attempt_no: attemptNo };
    const url = `${this.realtimeApiUrl}/api/driver/jobs/${rideId}/accept`;
    return this.http.post<any>(url, body, { headers });
  }

  rejectJob(rideId: number, attemptNo: number): Observable<any> {
    const headers = this.getAuthHeaders();
    const body: RejectJobRequest = { attempt_no: attemptNo };
    const url = `${this.realtimeApiUrl}/api/driver/jobs/${rideId}/reject`;
    return this.http.post<any>(url, body, { headers });
  }

  getDriverStatus(): Observable<DriverStatusResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<DriverStatusResponse>(`${this.apiUrl}/transportation/driver/status`, { headers });
  }

  getDriverOnboardingStatus(): Observable<DriverOnboardingStatusResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<DriverOnboardingStatusResponse>(`${this.apiUrl}/transportation/driver/onboarding-status`, { headers });
  }

  updateDriverStatus(status: string): Observable<{ message: string }> {
    const headers = this.getAuthHeaders();
    const body: UpdateDriverStatusRequest = {
      status: status
    };

    return this.http.post<{ message: string }>(`${this.apiUrl}/transportation/driver/status`, body, { headers });
  }

  // Utility methods for working with the new data structure
  getTotalOrderValue(request: DriverJobOffer): number {
    return request.offered_rate;
  }

  getTotalItemCount(request: DriverJobOffer): number {
    // Not available in DriverJobOffer, return 0
    return 0;
  }

  getUniqueProductCategories(request: DriverJobOffer): Set<number> {
    // Not available
    return new Set<number>();
  }


}
