import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface WholesellerPrice {
  wholeseller_id: number;
  price_per_kg: number;
}

export interface GroupedPriceComparison {
  product_name: string;
  prices: WholesellerPrice[];
}

export interface BranchPriceData {
  branch_id: number;
  branch_name: string;
  product_id: number;
  product_name: string;
  price_per_unit: number;
  current_stock: number;
}

@Injectable({
  providedIn: 'root'
})
export class MarketComparisonService {
  private readonly apiUrl = environment.apiUrl;
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    if (!token) {
      console.warn('MarketComparisonService: No authentication token found');
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token || ''}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error (${error.status}): ${error.message}`;

      if (error.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.status === 403) {
        errorMessage = 'Access denied. You do not have permission.';
      } else if (error.status === 404) {
        errorMessage = 'Requested resource not found.';
      } else if (error.status === 500) {
        errorMessage = 'Internal server error. Please try again later.';
      }
    }

    console.error('MarketComparisonService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  getWholesellerPriceComparison(productIds: number[]): Observable<GroupedPriceComparison | GroupedPriceComparison[]> {
    if (!productIds || productIds.length === 0) {
      console.warn('MarketComparisonService: No product IDs provided');
      return throwError(() => new Error('Product IDs are required'));
    }

    const headers = this.getAuthHeaders();
    const params = new HttpParams()
      .set('product_ids', productIds.join(','));

    return this.http.get<GroupedPriceComparison | GroupedPriceComparison[]>(
      `${this.apiUrl}/getWholesellerPriceComparison`,
      { headers, params }
    ).pipe(
      timeout(this.REQUEST_TIMEOUT),
      catchError(this.handleError)
    );
  }

  getBranchPriceComparison(branchIds: number[], productIds: number[]): Observable<BranchPriceData[]> {
    if (!branchIds || branchIds.length === 0) {
      console.warn('MarketComparisonService: No branch IDs provided');
      return throwError(() => new Error('Branch IDs are required'));
    }

    if (!productIds || productIds.length === 0) {
      console.warn('MarketComparisonService: No product IDs provided');
      return throwError(() => new Error('Product IDs are required'));
    }

    const headers = this.getAuthHeaders();
    const params = new HttpParams()
      .set('branch_ids', branchIds.join(','))
      .set('product_ids', productIds.join(','));

    return this.http.get<BranchPriceData[]>(
      `${this.apiUrl}/getBranchPriceComparison`,
      { headers, params }
    ).pipe(
      timeout(this.REQUEST_TIMEOUT),
      catchError(this.handleError)
    );
  }
}