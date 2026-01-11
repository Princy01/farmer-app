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
        mandi_location?: string;
        mandi_incharge?: string;
        mandi_incharge_num?: string;
        mandi_pincode?: string;
        mandi_address?: string;
        mandi_state_id?: number;
        state_name?: string;
        state_shortnames?: string;
        mandi_shortnames?: string;
        mandi_city_id?: number;
        city_name?: string;
        city_shortnames?: string;
}

export interface SlowMovingProductData {
        product_name: string;
        mandi_name: string;
        stock_left: number;
        weekly_sales: number;
        days_in_stock: number;
}

export interface BranchData {
        branch_id: number;
        bid: number;
        shop_name: string;
        type_id: number;
        location_id: number;
        location_name: string;
        state_id: number;
        state_name: string;
        state_shortname: string;
        city_id: number;
        city_name: string;
        city_shortname: string;
        address: string;
        email: string;
        number: string;
        gst_num: string;
        pan_num: string;
        privilege_user: boolean;
        established_year: string;
        created_at: string;
        updated_at: string;
        active_status: boolean;
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



        getSlowMovingProducts(): Observable<SlowMovingProductData[]> {
                const headers = this.getAuthHeaders();
                return this.http.get<SlowMovingProductData[]>(`${this.apiUrl}/getSlowMovingProducts`, { headers });
        }

        getCurrentStockByProduct(productId: number): Observable<CurrentStockData[]> {
                const headers = this.getAuthHeaders();
                return this.http.get<CurrentStockData[]>(`${this.apiUrl}/getCurrentStockByProduct/${productId}`, { headers });
        }
        // Update the getMandiList method in StockInsightsService
        getAllBusinessBranches(): Observable<BranchData[]> {
                const headers = this.getAuthHeaders();
                return this.http.get<BranchData[]>(`${this.apiUrl}/getAllBusinessBranchesWithNamesByUser`, { headers });
        }

        getMandiList(): Observable<MandiBasicInfo[]> {
                const headers = this.getAuthHeaders();
                return this.http.get<BranchData[]>(`${this.apiUrl}/getAllBusinessBranchesWithNamesByUser`, { headers })
                        .pipe(
                                map(branches => branches.map(branch => ({
                                        mandi_id: branch.branch_id,
                                        mandi_name: branch.shop_name,
                                        mandi_location: branch.location_name,
                                        mandi_address: branch.address,
                                        mandi_state_id: branch.state_id,
                                        state_name: branch.state_name,
                                        state_shortnames: branch.state_shortname,
                                        mandi_city_id: branch.city_id,
                                        city_name: branch.city_name,
                                        city_shortnames: branch.city_shortname
                                })))
                        );
        }
}