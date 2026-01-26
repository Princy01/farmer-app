import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

// Product interface matching backend
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

// Order Item interface matching backend
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

// Order interface matching backend
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
  items: OrderItem[];
}

// Updated TransportRequest interface
export interface TransportRequest {
  job_id: number;
  id: string;
  order_ids?: number[];
  pickup_location: string;
  dropoff_location: string;
  pickup_city_id?: number;
  dropoff_city_id?: number;
  pickup_branch_id?: number;
  dropoff_branch_id?: number;
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
  job_id: number;
  vehicle_id: number;
}

export interface RejectJobRequest {
  job_id: number;
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

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getTransportRequests(cityIds?: number[], branchIds?: number[]): Observable<{delivery_requests: TransportRequest[]}> {
    const headers = this.getAuthHeaders();
    let url = `${this.apiUrl}/requests/transport-requests`;

    const params = [];
    if (cityIds && cityIds.length > 0) {
      params.push(`city_ids=${cityIds.join(',')}`);
    }
    if (branchIds && branchIds.length > 0) {
      params.push(`branch_ids=${branchIds.join(',')}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http.get<{delivery_requests: TransportRequest[]}>(url, { headers });
  }

  acceptTransportRequest(jobId: number, vehicleId: number): Observable<{message: string}> {
    const headers = this.getAuthHeaders();
    const body: AcceptJobRequest = {
      job_id: jobId,
      vehicle_id: vehicleId
    };

    return this.http.post<{message: string}>(`${this.apiUrl}/requests/accept-transport-request`, body, { headers });
  }

  rejectTransportRequest(jobId: number): Observable<{message: string}> {
    const headers = this.getAuthHeaders();
    const body: RejectJobRequest = {
      job_id: jobId
    };

    return this.http.post<{message: string}>(`${this.apiUrl}/requests/reject-transport-request`, body, { headers });
  }

  getDriverStatus(): Observable<DriverStatusResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<DriverStatusResponse>(`${this.apiUrl}/driver/status`, { headers });
  }

  updateDriverStatus(status: string): Observable<{message: string}> {
    const headers = this.getAuthHeaders();
    const body: UpdateDriverStatusRequest = {
      status: status
    };

    return this.http.post<{message: string}>(`${this.apiUrl}/driver/status`, body, { headers });
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