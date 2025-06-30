import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Delivery {
  job_id: string;
  pickup_address: string;
  drop_address: string;
  order_id: number;
  weight_kg: number;
  base_price: number;
  hasDispute?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getDeliveryHistory(): Observable<{ deliveries: Delivery[] }> {
    return this.http.get<{ deliveries: Delivery[] }>(`${this.apiUrl}/transportation/delivery/delivery-history`);
  }

  resolveDispute(jobId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resolve-dispute`, { job_id: jobId });
  }
}