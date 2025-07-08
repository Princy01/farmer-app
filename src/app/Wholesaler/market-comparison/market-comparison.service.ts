export interface WholesellerPrice {
        wholeseller_id: number;
        // wholeseller_name?: string;
        // mandi_name?: string;
        price_per_kg: number;
}

export interface GroupedPriceComparison {
        product_name: string;
        prices: WholesellerPrice[];
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MarketComparisonService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getWholesellerPriceComparison(productIds: number[], wholesalerId: number): Observable<GroupedPriceComparison | GroupedPriceComparison[]> {
    const params = new HttpParams()
      .set('product_ids', productIds.join(','))
      .set('wholesaler_id', wholesalerId.toString());

    return this.http.get<GroupedPriceComparison | GroupedPriceComparison[]>(
      `${this.apiUrl}/getWholesellerPriceComparison`,
      { params }
    );
  }
}