import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { timeout, retry, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface Delivery {
  job_id: number;
  order_ids: number[] | null;
  weight_kg: number;
  base_price: number;
  delivery_date: string;
  job_status?: string;
  delivery_status?: string;
  display_status?: string;
  status_note?: string;
  is_overdue?: boolean;
  is_reassigned?: boolean;
  accepted_at?: string;
  pickup_confirmed_at?: string;
  delivered_at?: string;
  orders: DeliveryOrder[] | null;
}

export interface DeliveryOrder {
  order_id: number;
  delivery_address?: string | null;
  order_status: string;
  final_amount: number;
  pickup_branch: DeliveryBranch | null;
  dropoff_branch: DeliveryBranch | null;
  items: DeliveryItem[] | null;
}

export interface DeliveryBranch {
  branch_id: number;
  branch_name: string;
  branch_address: string;
  branch_number: string;
  city_id: number;
}

export interface DeliveryItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_name: string;
  wholeseller_price: number;
}

interface DeliveryHistoryResponse {
  deliveries: Delivery[];
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getDeliveryHistory(): Observable<DeliveryHistoryResponse> {
    return this.http.get<DeliveryHistoryResponse>(`${this.apiUrl}/transportation/delivery/delivery-history`).pipe(
      timeout(30000),
      retry({
        count: 3,
        delay: (error, retryCount) => {
          const delayMs = Math.pow(2, retryCount - 1) * 1000;
          return new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  resolveDispute(jobId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/transportation/delivery/resolve-dispute`, { job_id: jobId }).pipe(
      timeout(30000),
      retry({
        count: 3,
        delay: (error, retryCount) => {
          const delayMs = Math.pow(2, retryCount - 1) * 1000;
          return new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}
