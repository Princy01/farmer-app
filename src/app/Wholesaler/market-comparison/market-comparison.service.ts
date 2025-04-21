export interface WholesellerPrice {
        wholeseller_id: number;
        price_per_kg: number;
      }

      export interface GroupedPriceComparison {
        product_name: string;
        prices: WholesellerPrice[];
      }

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE_URL = 'http://127.0.0.1:3000';

@Injectable({
  providedIn: 'root'
})
export class MarketComparisonService {

  constructor(private http: HttpClient) {}

  getWholesellerPriceComparison(productIds: number[]): Observable<GroupedPriceComparison | GroupedPriceComparison[]> {
    const params = new HttpParams().set('product_ids', productIds.join(','));
    return this.http.get<GroupedPriceComparison | GroupedPriceComparison[]>(`${API_BASE_URL}/getWholesellerPriceComparison`, { params });
  }
}
