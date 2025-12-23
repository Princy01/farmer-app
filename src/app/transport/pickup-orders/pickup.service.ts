import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ActiveJob {
  assignment_id: number;
  job_id: number;
  pickup_location: string;
  dropoff_location: string;
  delivery_date: string; // ISO string
  base_price: number;
  weight: number;
  distance: number;
  job_status: string;
  accepted_at?: string;
  pickup_confirmed_at?: string;
  delivery_status: string;
}

export interface JobOrder {
  order_id: number;
  date_of_order: string; // ISO string
  delivery_address: string;
  total_order_amount: number;
  final_amount: number;
  order_status_id: number;
  order_status_text: string;
  actual_delivery_date?: string;
  retailer_id: number;
}

@Injectable({ providedIn: 'root' })
export class PickupService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getActiveJobs(): Observable<ActiveJob[]> {
    return this.http.get<ActiveJob[]>(`${this.apiUrl}/transportation/delivery/active-jobs`);
  }

  getJobOrders(jobId: number): Observable<JobOrder[]> {
    return this.http.get<JobOrder[]>(`${this.apiUrl}/transportation/delivery/job-orders/${jobId}`);
  }

  confirmPickup(orderId: number, otp: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/transportation/delivery/confirm-pickup-otp`, {
      order_id: orderId,
      otp: otp
    });
}
}