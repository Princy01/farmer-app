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

export interface TransportRequest {
  job_id: number;
  id: string;
  order_ids?: number[];
  // REMOVE these fields:
  // pickup_location: string;
  // dropoff_location: string;
  // pickup_city_id?: number;
  // dropoff_city_id?: number;
  // pickup_branch_id?: number;
  // dropoff_branch_id?: number;

  weight: number;
  distance: number;
  delivery_type: string;
  delivery_date: string;
  base_price: number;
  urgency: string;
  requested_date: string;
  load_type: string;
  delivery_date_str: string;
  requested_date_str: string;
  orders?: Order[];
}

export interface AcceptJobRequest {
  vehicle_id: number;
}

export interface RejectJobRequest {
  // Empty - rejection handled on frontend only
}

export interface DriverStatusResponse {
  driver_id: number;
  status: string; // 'active' | 'inactive'
}

export interface UpdateDriverStatusRequest {
  status: string; // 'active' | 'inactive'
}

@Injectable({
  providedIn: 'root'
})
export class TransportRequestService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getTransportRequests(city?: string): Observable<any> {
    const headers = this.getAuthHeaders();
    let url = `${this.apiUrl}/transportation/driver/jobs/open`;

    if (city) {
      url += `?city=${encodeURIComponent(city)}`;
    }

    return this.http.get<any>(url, { headers });
  }

  getTransportRequestDetailed(cityIds: number[], branchIds: number[]): Observable<any> {
    const headers = this.getAuthHeaders();
    let url = `${this.apiUrl}/transportation/requests/transport-requests`;
    if (cityIds.length > 0) {
      const cityParams = cityIds.map(id => `city_ids=${id}`).join('&');
      url += `?${cityParams}`;
    }

    if (branchIds.length > 0) {
      const branchParams = branchIds.map(id => `branch_ids=${id}`).join('&');
      url += cityIds.length > 0 ? `&${branchParams}` : `?${branchParams}`;
    }

    return this.http.get<any>(url, { headers });
  }

  acceptTransportRequest(jobId: number, vehicleId: number): Observable<{ status: string }> {
    const headers = this.getAuthHeaders();
    const body: AcceptJobRequest = {
      vehicle_id: vehicleId
    };

    return this.http.post<{ status: string }>(`${this.apiUrl}/transportation/driver/jobs/${jobId}/accept`, body, { headers });
  }

  rejectTransportRequest(jobId: number): Observable<{ status: string }> {
    const headers = this.getAuthHeaders();
    const body: RejectJobRequest = {};

    return this.http.post<{ status: string }>(`${this.apiUrl}/transportation/driver/jobs/${jobId}/reject`, body, { headers });
  }

  getDriverStatus(): Observable<DriverStatusResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<DriverStatusResponse>(`${this.apiUrl}/transportation/driver/status`, { headers });
  }

  updateDriverStatus(status: string): Observable<{ message: string }> {
    const headers = this.getAuthHeaders();
    const body: UpdateDriverStatusRequest = {
      status: status
    };

    return this.http.post<{ message: string }>(`${this.apiUrl}/transportation/driver/status`, body, { headers });
  }

  // Utility methods for working with the new data structure
  getTotalOrderValue(request: TransportRequest): number {
    if (!request.orders || request.orders.length === 0) return 0;
    return request.orders.reduce((total, order) => total + order.final_amount, 0);
  }

  getTotalItemCount(request: TransportRequest): number {
    if (!request.orders || request.orders.length === 0) return 0;
    return request.orders.reduce((total, order) =>
      total + order.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0), 0
    );
  }

  getUniqueProductCategories(request: TransportRequest): Set<number> {
    const categories = new Set<number>();
    if (!request.orders) return categories;

    request.orders.forEach(order => {
      order.items.forEach(item => {
        categories.add(item.product.category_id);
      });
    });

    return categories;
  }


}