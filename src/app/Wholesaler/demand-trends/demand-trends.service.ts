import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../auth/auth.service';

export interface DemandPatternRow {
  product_id: number;
  product_name: string;
  total_quantity: number;
  unit_id: number;
  unit_name: string;
  period: string;
}

export interface ProductDemandComparisonRow {
  product_id: number;
  product_name: string;
  total_quantity: number;
  rank: number;
}

@Injectable({
  providedIn: 'root'
})
export class DemandTrendsService {
  private readonly apiUrl = environment.apiUrl;
  private readonly REQUEST_TIMEOUT = 30000;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      errorMessage = `Server Error: ${error.status} - ${error.message}`;
    }

    console.error('Demand Trends Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  getDemandPatterns(range: string): Observable<DemandPatternRow[]> {
    if (!range) {
      return throwError(() => new Error('Time range is required'));
    }

    const headers = this.getAuthHeaders();
    return this.http.get<DemandPatternRow[]>(
      `${this.apiUrl}/getDemandPatterns/${range}`,
      { headers }
    ).pipe(
      timeout(this.REQUEST_TIMEOUT),
      catchError(this.handleError)
    );
  }

  getProductDemandComparison(range: string): Observable<ProductDemandComparisonRow[]> {
    if (!range) {
      return throwError(() => new Error('Time range is required'));
    }

    const headers = this.getAuthHeaders();
    return this.http.get<ProductDemandComparisonRow[]>(
      `${this.apiUrl}/getProductDemandComparison/${range}`,
      { headers }
    ).pipe(
      timeout(this.REQUEST_TIMEOUT),
      catchError(this.handleError)
    );
  }
}