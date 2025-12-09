import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface OrderItem {
  product_id: number;
  quantity: number;
  unit_id: number;
  price: number;
  discount_amount?: number;
  tax_amount?: number;
  wholeseller_id: number;
}

export interface CreateOrderRequest {
  date_of_order: string; // YYYY-MM-DD format
  order_status: number;
  delivery_address: string;
  items: OrderItem[];
}

export interface CreateOrderResponse {
  message: string;
  order_ids: number[];
}
export interface TransportJobRequest {
  order_ids: number[];
  pickup_location: string;
  dropoff_location: string;
  pickup_city_id?: number;
  dropoff_city_id?: number;
  pickup_branch_id?: number;
  dropoff_branch_id?: number;
  weight: number;
  distance: number;
  delivery_type: string;
  base_price: number;
  urgency: string;
  requested_date: string;
  load_type: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createOrder(orderData: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(
      `${this.apiUrl}/CreateRetailerOrder`,
      orderData
    );
  }

  createTransportJob(transportData: TransportJobRequest): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/create-transport-job-with-orderids-request`,
      transportData
    );
  }
}