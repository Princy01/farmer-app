import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
  quality: number;
  wastage: number;
  stock_received: number;
  stock_carried_forward: number;
  price_per_unit: number;
  b_b_id: number;
  date_of_entry: string;
}

export interface UpdateStockPayload {
  stockId: number;
  quantity?: number;
  price?: number;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProductsStockOfBranchForDate(branchId: number, date: string): Observable<ProductPriceData[]> {
  console.log('Calling API:', `${this.apiUrl}/getAllProductsStockOfBusinessBranchOfTheDate/${branchId}/${date}`);
  return this.http.get<ProductPriceData[]>(
    `${this.apiUrl}/getAllProductsStockOfBusinessBranchOfTheDate/${branchId}/${date}`
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
    return this.http.post(`${this.apiUrl}/updateStockPriceDataForBusinessBranch`, data);
  }
}