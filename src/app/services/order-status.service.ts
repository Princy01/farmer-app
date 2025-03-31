import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderStatus {
  order_status_id: number;
  order_status: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderStatusService {
  private apiUrl = 'http://127.0.0.1:3000';

  constructor(private http: HttpClient) {}

  getOrderStatuses(): Observable<OrderStatus[]> {
    return this.http.get<OrderStatus[]>(`${this.apiUrl}/getOrderStatus`);
  }

  getOrderStatusById(orderStatusId: number): Observable<OrderStatus> {
    return this.http.get<OrderStatus>(`${this.apiUrl}/getOrderStatusById/${orderStatusId}`);
  }

  insertOrderStatus(statusData: OrderStatus): Observable<any> {
    return this.http.post(`${this.apiUrl}/orderStatusDetails`, statusData);
  }

  updateOrderStatus(orderStatus: OrderStatus): Observable<any> {
    return this.http.put(`${this.apiUrl}/orderStatusUpdate`, orderStatus);
  }

  // No delete method in backend
}
