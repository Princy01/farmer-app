import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderStatus {
  order_id: number;
  order_status: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderStatusService {
  private apiUrl = 'http://127.0.0.1:3000/orders';

  constructor(private http: HttpClient) {}

  getOrderStatuses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getOrderStatus`);
  }

  getOrderStatusById(orderStatusId: number): Observable<any> {
    // need to create the endpoint in the backend
    return this.http.get<any>(`${this.apiUrl}/getOrderStatus/${orderStatusId}`);
  }

  insertOrderStatus(statusData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/orderStatusDetails`, statusData);
  }

  updateOrderStatus(orderStatus:any): Observable<any> {
    const orderStatusId = orderStatus.order_id;
    const statusData = orderStatus
    return this.http.put(`${this.apiUrl}/orderStatusUpdate`, statusData);
  }

  deleteOrderStatus(orderStatusId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/orderStatusDelete/${orderStatusId}`);
  }
}
