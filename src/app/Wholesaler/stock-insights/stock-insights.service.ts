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
import { environment } from 'src/environments/environment';

@Injectable({
        providedIn: 'root'
})
export class StockInsightsService {
        private apiUrl = environment.apiUrl;

        constructor(private http: HttpClient) { }

        getCurrentStockByMandi(mandiId: number, wholesalerId: number): Observable<CurrentStockData[]> {
                return this.http.get<CurrentStockData[]>(`${this.apiUrl}/getCurrentStockByMandi/${mandiId}/${wholesalerId}`);
        }

        getLeastStockedProducts(wholesalerId: number): Observable<LeastStockedData[]> {
                return this.http.get<LeastStockedData[]>(`${this.apiUrl}/getMandiStockedProduct/${wholesalerId}`);
        }

        getLowStockItems(wholesalerId: number): Observable<LowStockItemData[]> {
                return this.http.get<LowStockItemData[]>(`${this.apiUrl}/getLowStockItems/${wholesalerId}`);
        }

        getStockAvailabilityPercentage(wholesalerId: number): Observable<StockAvailabilityData[]> {
                return this.http.get<StockAvailabilityData[]>(`${this.apiUrl}/getStockAvailabilityPercentage/${wholesalerId}`);
        }

        getMandiList(wholesalerId: number): Observable<MandiBasicInfo[]> {
                return this.http.get<MandiBasicInfo[]>(`${this.apiUrl}/getMandiDetails/${wholesalerId}`)
                        .pipe(
                                map(mandis => mandis.map(mandi => ({
                                        mandi_id: mandi.mandi_id,
                                        mandi_name: mandi.mandi_name
                                })))
                        );
        }

        getSlowMovingProducts(wholesalerId: number): Observable<SlowMovingProductData[]> {
                return this.http.get<SlowMovingProductData[]>(`${this.apiUrl}/getSlowMovingProducts/${wholesalerId}`);
        }
}