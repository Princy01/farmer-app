import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Item {
  product_id: number;
  quantity: number;
  unit_id: number;
  price: number;
  discount_amount: number;
  tax_amount: number;
  wholeseller_id: number;
  product_name: string;
  unit_name: string;
  wholeseller_name?: string;
  branch_id?: number;
}

export interface OrderGroup {
  wholeseller_id: number;
  branch_id: number;
  items: Item[];
  total_order_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
}

export interface CreateBatchOrderRequest {
  date_of_order: string;
  order_status: number;
  delivery_address: string;
  order_groups: OrderGroup[];
  delivery_amount: number;
  retailer_branch_id: number;
}

export interface CreateBatchOrderResponse {
  status: string;
  message: string;
  order_ids: number[];
  orders_total: number;
  delivery_cost: number;
  grand_total: number;
}

export interface RetailerOrderResponse {
  order_id: number;
  date_of_order: string; // ISO 8601 string from backend
  order_status: number;
  actual_delivery_date?: string | null;
  retailer_id: number;
  wholeseller_ids: number[];
  delivery_address: string;
  total_order_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  items: Item[];
}

export interface TransportRequestWithOrders {
  distance: number;
  delivery_type: string;
  urgency: 'low' | 'standard' | 'high';
  requested_date?: Date | null;
  load_type: string;
  status: string;
  order_ids: number[];
  base_price: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Create batch order (splits into multiple orders by wholeseller)
  createOrder(orderData: CreateBatchOrderRequest): Observable<CreateBatchOrderResponse> {
    return this.http.post<CreateBatchOrderResponse>(
      `${this.apiUrl}/CreateRetailerOrder`,
      orderData
    );
  }

  createTransportJob(transportData: TransportRequestWithOrders): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/transportation/requests/create-transport-job-with-orderids-request`,
      transportData
    );
  }

  getRetailerOrderDetails(orderId: number): Observable<RetailerOrderResponse> {
    return this.http.get<RetailerOrderResponse>(
      `${this.apiUrl}/getRetailerOrderDetails/${orderId}`
    );
  }
}