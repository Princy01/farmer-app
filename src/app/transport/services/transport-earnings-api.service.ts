import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, concatMap, retryWhen, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface TransporterEarningsQuery {
  from?: string;
  to?: string;
  status?: 'all' | 'pending' | 'ready' | 'credited' | 'held' | 'deducted' | 'cancelled';
}

export interface TransporterEarningsSummary {
  from_date?: string;
  to_date?: string;
  status: string;
  expected_amount: number;
  deduction_amount: number;
  net_payable_amount: number;
  credited_amount: number;
  pending_amount: number;
  held_amount: number;
  ready_amount: number;
  job_count: number;
  order_count: number;
  payout_destination?: string;
  timezone: string;
  generated_at: string;
}

export interface TransporterEarningsDay {
  date: string;
  job_count: number;
  order_count: number;
  credited_count: number;
  expected_amount: number;
  deduction_amount: number;
  net_payable: number;
  credited_amount: number;
  pending_amount: number;
}

export interface TransporterEarningsJob {
  allocation_id: number;
  checkout_session_id?: number;
  job_id: number;
  event_date?: string;
  delivery_date?: string;
  accepted_at?: string;
  delivered_at?: string;
  release_after?: string;
  released_at?: string;
  transport_status?: string;
  delivery_status?: string;
  pickup_location?: string;
  delivery_location?: string;
  order_ids?: string;
  order_count: number;
  weight: number;
  distance: number;
  settlement_status: string;
  settlement_status_label: string;
  expected_amount: number;
  fee_amount: number;
  tax_amount: number;
  hold_amount: number;
  deduction_amount: number;
  actual_amount: number;
  credited_amount: number;
  pending_amount: number;
  difference_amount: number;
  payout_reference?: string;
  payout_destination?: string;
  reason_summary?: string;
  hold_reason?: string;
  admin_note?: string;
}

export interface TransporterEarningsOrder {
  order_id: number;
  order_status?: string;
  retailer_name?: string;
  wholesaler_name?: string;
  final_amount: number;
}

export interface TransporterEarningsJobsResponse {
  items: TransporterEarningsJob[];
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface TransporterEarningsJobDetail {
  job: TransporterEarningsJob;
  orders: TransporterEarningsOrder[];
  deduction_reasons: Array<{
    label: string;
    detail?: string;
    amount: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class TransportEarningsApiService {
  private readonly apiUrl = environment.apiUrl;
  private readonly requestTimeout = 30000;
  private readonly maxRetries = 3;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getSummary(query: TransporterEarningsQuery = {}): Observable<TransporterEarningsSummary> {
    return this.applyRetryLogic(
      this.http.get<TransporterEarningsSummary>(
        `${this.apiUrl}/transport/earnings/summary`,
        { headers: this.getAuthHeaders(), params: this.buildParams(query) }
      )
    );
  }

  getDays(query: TransporterEarningsQuery = {}): Observable<TransporterEarningsDay[]> {
    return this.applyRetryLogic(
      this.http.get<TransporterEarningsDay[]>(
        `${this.apiUrl}/transport/earnings/days`,
        { headers: this.getAuthHeaders(), params: this.buildParams(query) }
      )
    );
  }

  getJobs(
    query: TransporterEarningsQuery & { date?: string; page?: number; page_size?: number } = {}
  ): Observable<TransporterEarningsJobsResponse> {
    return this.applyRetryLogic(
      this.http.get<TransporterEarningsJobsResponse>(
        `${this.apiUrl}/transport/earnings/jobs`,
        { headers: this.getAuthHeaders(), params: this.buildParams(query) }
      )
    );
  }

  getJobDetail(jobId: number): Observable<TransporterEarningsJobDetail> {
    return this.applyRetryLogic(
      this.http.get<TransporterEarningsJobDetail>(
        `${this.apiUrl}/transport/earnings/jobs/${jobId}`,
        { headers: this.getAuthHeaders() }
      )
    );
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private applyRetryLogic<T>(observable: Observable<T>): Observable<T> {
    return observable.pipe(
      timeout(this.requestTimeout),
      retryWhen(errors =>
        errors.pipe(
          concatMap((err, idx) => {
            if (idx < this.maxRetries && this.isRetryableError(err)) {
              return timer(Math.pow(2, idx) * 1000);
            }
            return throwError(() => err);
          })
        )
      ),
      catchError(this.handleError.bind(this))
    );
  }

  private isRetryableError(error: any): boolean {
    return error?.name === 'TimeoutError' || error?.status === 0 || error?.status >= 500;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    return throwError(() => ({
      message: error?.error?.message || 'ERRORS.UNKNOWN_ERROR',
      status: error?.status
    }));
  }

  private buildParams(query: TransporterEarningsQuery & Record<string, any>): Record<string, string> {
    const params: Record<string, string> = {};
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = String(value);
      }
    });
    return params;
  }
}
