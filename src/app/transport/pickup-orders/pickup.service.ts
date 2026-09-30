import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, throwError } from 'rxjs';
import { timeout, retryWhen, take, mergeMap } from 'rxjs/operators';
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

export interface PickupOTP {
  order_id: number;
  user_id: number;
  otp_code: string;
  expires_at: string; // ISO string
  is_used?: boolean;
  used_at?: string;
  is_new?: boolean;
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
  wholesaler_name?: string | null;
  wholesaler_contact?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PickupService {
  private apiUrl = environment.apiUrl;
  private readonly TIMEOUT_MS = 30000; // 30 seconds

  constructor(private http: HttpClient) {}

  private exponentialBackoffRetry() {
    return retryWhen(errors =>
      errors.pipe(
        mergeMap((error, index) => {
          if (index >= 3) {
            return throwError(() => error);
          }
          const delayMs = Math.pow(2, index) * 1000;
          return timer(delayMs);
        })
      )
    );
  }

  getActiveJobs(): Observable<ActiveJob[]> {
    return this.http.get<ActiveJob[]>(
      `${this.apiUrl}/transportation/delivery/active-jobs`
    ).pipe(
      timeout(this.TIMEOUT_MS),
      this.exponentialBackoffRetry()
    ) as Observable<ActiveJob[]>;
  }

  getJobOrders(jobId: number): Observable<JobOrder[]> {
    return this.http.get<JobOrder[]>(
      `${this.apiUrl}/transportation/delivery/job-orders/${jobId}`
    ).pipe(
      timeout(this.TIMEOUT_MS),
      this.exponentialBackoffRetry()
    ) as Observable<JobOrder[]>;
  }

  cancelJob(jobId: number): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/transportation/delivery/cancel-job/${jobId}`,
      {}
    ).pipe(
      timeout(this.TIMEOUT_MS),
      this.exponentialBackoffRetry()
    );
  }

  getActivePickupOTP(orderId: number): Observable<PickupOTP> {
    return this.http.post<PickupOTP>(
      `${this.apiUrl}/transportation/delivery/get-pickup-otp`,
      { order_id: orderId }
    ).pipe(
      timeout(this.TIMEOUT_MS),
      this.exponentialBackoffRetry()
    ) as Observable<PickupOTP>;
  }

  confirmPickup(orderId: number, otp: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/transportation/delivery/confirm-pickup-otp`,
      { order_id: orderId, otp: otp }
    ).pipe(
      timeout(this.TIMEOUT_MS),
      this.exponentialBackoffRetry()
    );
  }
}