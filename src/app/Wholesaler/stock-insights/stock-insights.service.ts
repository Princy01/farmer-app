export interface CurrentStockData {
        product_id: number;
        product_name: string;
        mandi_id: number;
        mandi_name: string;
        current_stock: number;
}

export interface LeastStockedData {
        product_id: number;
        product_name: string;
        mandi_id: number;
        mandi_name: string;
        stock_left: number;
}

export interface StockAvailabilityData {
        stock_id: number;
        product_id: number;
        product_name: string;
        mandi_id: number;
        mandi_name: string;
        stock_left: number;
        maximum_stock_level: number;
        stock_availability_percentage: number;
}

export interface LowStockItemData {
        product_id: number;
        product_name: string;
        mandi_id: number;
        mandi_name: string;
        stock_left: number;
        minimum_stock_level: number;
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE_URL = 'http://127.0.0.1:3000';

@Injectable({
        providedIn: 'root'
})
export class StockInsightsService {

        constructor(private http: HttpClient) { }

        getCurrentStockByMandi(mandiId: number): Observable<CurrentStockData[]> {
                return this.http.get<CurrentStockData[]>(`${API_BASE_URL}/getCurrentStockByMandi/${mandiId}`);
        }

        getLeastStockedProducts(): Observable<LeastStockedData[]> {
                return this.http.get<LeastStockedData[]>(`${API_BASE_URL}/getLeastStockedProduct`);
        }

        getLowStockItems(): Observable<LowStockItemData[]> {
                return this.http.get<LowStockItemData[]>(`${API_BASE_URL}/getLowStockItems`);
        }

        getStockAvailabilityPercentage(): Observable<StockAvailabilityData[]> {
                return this.http.get<StockAvailabilityData[]>(`${API_BASE_URL}/getStockAvailabilityPercentage`);
        }
}
