import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface OrderItem {
  product_id: number;
  quantity: number;
  unit_id: number;
  price: number; // wholeseller_price
  discount_amount: number;
  tax_amount: number;
  wholeseller_id: number;
  // Optional: add product_name, image_url, etc. if fetched separately later
}

export interface RetailerOrderDetails {
  order_id: number;
  date_of_order: string; // ISO string
  order_status: number;
  actual_delivery_date?: string | null; // ISO or null
  retailer_id: number;
  wholeseller_ids: number[];
  delivery_address: string;
  total_order_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  items: OrderItem[];
}

@Injectable({
  providedIn: 'root'
})
export class RetailerOrderService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getOrderDetails(orderId: number): Observable<RetailerOrderDetails> {
    return this.http.get<RetailerOrderDetails>(`${this.apiUrl}/getRetailerOrderDetails/${orderId}`);
  }
}