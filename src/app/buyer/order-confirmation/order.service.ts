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
  branch_id?: number;
}

export interface CreateOrderRequest {
  date_of_order: string;
  order_status: number;
  delivery_address: string;
  items: Item[];
  retailer_id?: number;
  wholeseller_id?: number;
  delivery_amount?: number;
  total_order_amount?: number;
  discount_amount?: number;
  tax_amount?: number;
  final_amount?: number;
}

export interface CreateOrderResponse {
  message: string;
  order_ids: number[];
}

export interface TransportRequestWithOrders {
  distance: number;
  delivery_type: string;
  urgency?: string | null;
  requested_date?: Date | null;
  load_type: string;
  status: string;
  order_ids: number[];
}

export interface RetailerOrderResponse {
  order_id: number;
  date_of_order: string;
  order_status: number;
  actual_delivery_date?: string;
  retailer_id: number;
  wholeseller_ids: number[];
  delivery_address: string;
  total_order_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  items: Item[];
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