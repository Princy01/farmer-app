import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../auth/auth.service';  // Assuming AuthService exists for token

export interface PriceComparisonRow {
  product_id: number;
  product_name: string;
  mandi_name: string;
  price: number;
  unit_name: string;
}

@Injectable({
  providedIn: 'root'
})
export class RetailerTrendsService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getPriceComparison(productIds: string): Observable<PriceComparisonRow[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<PriceComparisonRow[]>(`${this.apiUrl}/getPriceComparison?product_ids=${productIds}`, { headers })
      .pipe(
        catchError(error => {
          console.error('Get price comparison failed:', error);
          return throwError(() => error);
        })
      );
  }
}