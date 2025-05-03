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

export interface MandiStockInfo {
        mandi_id: number;
        mandi_name: string;
        mandi_stock: number;
}

export interface LowStockItemData {
        product_id: number;
        product_name: string;
        current_stock: number;
        mandis: MandiStockInfo[];
}

export interface MandiBasicInfo {
        mandi_id: number;
        mandi_name: string;
}

export interface SlowMovingProductData {
        product_name: string;
        mandi_name: string;
        stock_left: number;
        weekly_sales: number;
        days_in_stock: number;
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

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
                return this.http.get<LeastStockedData[]>(`${API_BASE_URL}/getMandiStockedProduct`);
        }

        getLowStockItems(): Observable<LowStockItemData[]> {
                return this.http.get<LowStockItemData[]>(`${API_BASE_URL}/getLowStockItems`);
        }

        getStockAvailabilityPercentage(): Observable<StockAvailabilityData[]> {
                return this.http.get<StockAvailabilityData[]>(`${API_BASE_URL}/getStockAvailabilityPercentage`);
        }

        getMandiList(): Observable<MandiBasicInfo[]> {
                return this.http.get<MandiBasicInfo[]>(`${API_BASE_URL}/getMandiDetails`)
                        .pipe(
                                map(mandis => mandis.map(mandi => ({
                                        mandi_id: mandi.mandi_id,
                                        mandi_name: mandi.mandi_name
                                })))
                        );
        }

        getSlowMovingProducts(): Observable<SlowMovingProductData[]> {
                return this.http.get<SlowMovingProductData[]>(`${API_BASE_URL}/getSlowMovingProducts`);
        }
}
