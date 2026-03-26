import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { timeout, retry, catchError } from 'rxjs/operators';
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
    return this.http.get<{ deliveries: Delivery[] }>(`${this.apiUrl}/transportation/delivery/delivery-history`).pipe(
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

  resolveDispute(jobId: string): Observable<any> {
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