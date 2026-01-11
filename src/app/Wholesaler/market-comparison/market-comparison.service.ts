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

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MarketComparisonService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getWholesellerPriceComparison(productIds: number[]): Observable<GroupedPriceComparison | GroupedPriceComparison[]> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams()
      .set('product_ids', productIds.join(','));

    return this.http.get<GroupedPriceComparison | GroupedPriceComparison[]>(
      `${this.apiUrl}/getWholesellerPriceComparison`,
      { headers, params }
    );
  }

  getBranchPriceComparison(branchIds: number[], productIds: number[]): Observable<BranchPriceData[]> {
  const headers = this.getAuthHeaders();
  const params = new HttpParams()
    .set('branch_ids', branchIds.join(','))
    .set('product_ids', productIds.join(','));

  return this.http.get<BranchPriceData[]>(
    `${this.apiUrl}/getBranchPriceComparison`,
    { headers, params }
  );
}
}