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

export interface AddStockPayload {
  productId: number;
  branchId: number;
  quantity: number;
  price: number;
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

  addStock(data: AddStockPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/addStockPriceDataForBusinessBranch`, data);
  }

  updateStock(data: UpdateStockPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/updateStockPriceDataForBusinessBranch`, data);
  }

  // Dummy for dashboard listing until you create GET API
  getTodayStock(): Observable<any[]> {
    return new Observable(observer => {
      observer.next([
        { id: 1, productName: 'Tomato', currentStock: 200, price: 20 },
        { id: 2, productName: 'Potato', currentStock: 300, price: 15 }
      ]);
      observer.complete();
    });
  }
}
