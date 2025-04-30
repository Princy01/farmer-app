import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

//for home screen
interface OrderSummary {
  wholeseller_id: number;
  mandi_id: number;
  product_id: number;
  product_name: string;
  stock_left: number;
  stock_in: number;
}

//for My Orders screen
interface OrderItem {
  order_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_id: number;
  unit_name: string;
  max_item_price: number;
}

interface OrderItemDetails {
  order_id: number;
  total_order_amount: number;
  order_items: OrderItem[];
}

//for Order Details screen
interface OrderDetailedView extends OrderItemDetails {
  mandi_name: string;
  mandi_location: string;
  retailer_name: string;
  retailer_contact: string;
  order_date: string;
  order_status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'completed';
  delivery_date?: string;
  special_instructions?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WholesalerApiService {
  private readonly API_URL = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  getOrderSummary(): Observable<OrderSummary[]> {
    return this.http.get<OrderSummary[]>(`${this.API_URL}/getOrderSummary`);
  }

  getOrderItemDetails(): Observable<OrderItemDetails[]> {
    return this.http.get<OrderItemDetails[]>(`${this.API_URL}/getOrderItemDetails`);
  }

  getOrderDetails(orderId: number): Observable<OrderDetailedView> {
    return this.http.get<OrderDetailedView>(`${this.API_URL}/getOrderDetails/${orderId}`);
  }
}