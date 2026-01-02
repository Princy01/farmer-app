import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../auth/auth.service';

export interface DemandPatternRow {
  product_id: number;
  product_name: string;
  total_quantity: number;
  unit_id: number;
  unit_name: string;
  period: string; // ISO date string
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
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getDemandPatterns(range: string): Observable<DemandPatternRow[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<DemandPatternRow[]>(`${this.apiUrl}/getDemandPatterns/${range}`, { headers })
      .pipe(
        catchError(error => {
          console.error('Get demand patterns failed:', error);
          return throwError(() => error);
        })
      );
  }

  getProductDemandComparison(range: string): Observable<ProductDemandComparisonRow[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ProductDemandComparisonRow[]>(`${this.apiUrl}/getProductDemandComparison/${range}`, { headers })
      .pipe(
        catchError(error => {
          console.error('Get product demand comparison failed:', error);
          return throwError(() => error);
        })
      );
  }
}