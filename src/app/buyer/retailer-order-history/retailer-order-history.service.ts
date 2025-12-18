import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface RetailerOrderHistory {
  order_id: number;
  date_of_order: string;
  order_status: number | null;
  delivery_address: string;
  total_order_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  actual_delivery_date?: string | null;
}

export interface RetailerOrderHistoryResponse {
  current_orders: RetailerOrderHistory[];
  order_history: RetailerOrderHistory[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getOrderHistory(): Observable<RetailerOrderHistoryResponse> {
    return this.http.get<RetailerOrderHistoryResponse>(`${this.apiUrl}/order_history`);
  }
}