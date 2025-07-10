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
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

@Injectable({
        providedIn: 'root'
})
export class StockInsightsService {
        private apiUrl = environment.apiUrl;

        constructor(
                private http: HttpClient,
                private authService: AuthService
        ) { }

        private getAuthHeaders(): HttpHeaders {
                const token = this.authService.getToken();
                return new HttpHeaders({
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                });
        }

        getCurrentStockByMandi(mandiId: number): Observable<CurrentStockData[]> {
                const headers = this.getAuthHeaders();
                return this.http.get<CurrentStockData[]>(`${this.apiUrl}/getCurrentStockByMandi/${mandiId}`, { headers });
        }

        getLeastStockedProducts(): Observable<LeastStockedData[]> {
                const headers = this.getAuthHeaders();
                return this.http.get<LeastStockedData[]>(`${this.apiUrl}/getMandiStockedProduct`, { headers });
        }

        getLowStockItems(): Observable<LowStockItemData[]> {
                const headers = this.getAuthHeaders();
                return this.http.get<LowStockItemData[]>(`${this.apiUrl}/getLowStockItems`, { headers });
        }

        getStockAvailabilityPercentage(): Observable<StockAvailabilityData[]> {
                const headers = this.getAuthHeaders();
                return this.http.get<StockAvailabilityData[]>(`${this.apiUrl}/getStockAvailability`, { headers });
        }

        getMandiList(): Observable<MandiBasicInfo[]> {
                const headers = this.getAuthHeaders();
                return this.http.get<MandiBasicInfo[]>(`${this.apiUrl}/getMandiDetails`, { headers })
                        .pipe(
                                map(mandis => mandis.map(mandi => ({
                                        mandi_id: mandi.mandi_id,
                                        mandi_name: mandi.mandi_name
                                })))
                        );
        }

        getSlowMovingProducts(): Observable<SlowMovingProductData[]> {
                const headers = this.getAuthHeaders();
                return this.http.get<SlowMovingProductData[]>(`${this.apiUrl}/getSlowMovingProducts`, { headers });
        }
}