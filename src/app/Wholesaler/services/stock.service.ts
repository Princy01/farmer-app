import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export interface Stock {
  id: number;
  productName: string;
  currentStock: number;
  price: number;
}

export interface ProductPriceData {
  product_id: number;
  product_name: string;
  category_id: number;
  category_name: string;
  price_per_unit: number;
  current_stock: number;
  unit_id: number;
  units_name: string;
  last_date_of_entry: string;
}

export interface BusinessBranchWithNames {
  branch_id: number;
  shop_name: string;
  location_name: string;
  state_name: string;
  city_name: string;
  address: string;
}

export interface AddStockPayload {
  product_id: number;
  quality_id: number;
  wastage_measure_id: number;
  stock_received: number;
  stock_carried_forward: number;
  price_per_unit: number;
  b_b_id: number;
  date_of_entry: string;
  unit_id: number;
}

export interface UpdateStockPayload {
  product_id: number;
  new_quantity: number;
  mandi_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getProductsStockOfBranchForDate(branchId: number, date: string): Observable<ProductPriceData[]> {
    console.log('Calling API:', `${this.apiUrl}/getAllProductsStockOfBusinessBranchOfTheDate/${branchId}/${date}`);
    return this.http.get<ProductPriceData[]>(
      `${this.apiUrl}/getAllProductsStockOfBusinessBranchOfTheDate/${branchId}/${date}`
    ).pipe(
      // Log the response for debugging
      tap(data => console.log('API response:', data))
    );
  }

  getBranchesByUser(userId: number): Observable<BusinessBranchWithNames[]> {
    return this.http.get<BusinessBranchWithNames[]>(
      `${this.apiUrl}/getAllBusinessBranchesWithNamesByUser?userId=${userId}`
    );
  }

  addStock(data: AddStockPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/addStockPriceDataForBusinessBranch`, data);
  }

  updateStock(data: UpdateStockPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/wholesaler/product/update-stock-mandi`, data);
  }

  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getAllProducts`);
  }

  getQualities(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getAllQualityLevels`);
  }

  getWastageMeasures(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getAllWastageMeasures`);
  }

  getUnits(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getAllUnits`);
  }

}