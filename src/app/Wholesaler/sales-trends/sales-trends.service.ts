import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface SalesTrend {
    month_year: string;
    total_orders: number;
    total_revenue: number;
}

export interface TopSellingProduct {
    product_id: number;
    product_name: string | null;
    mandi_id: number;
    mandi_name: string | null;
    unit_id: number;
    quantity: number;
    price: number | null;
    total_quantity_kg: number | null;
    actual_delivery_date: string | null;
    total_price: number | null;
}

@Injectable({
    providedIn: 'root'
})
export class SalesTrendsService {
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

    getMonthlySales(): Observable<SalesTrend[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<SalesTrend[]>(`${this.apiUrl}/getSalesValue/monthly`, { headers });
    }

    getWeeklySales(): Observable<SalesTrend[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<SalesTrend[]>(`${this.apiUrl}/getSalesValue/weekly`, { headers });
    }

    getYearlySales(): Observable<SalesTrend[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<SalesTrend[]>(`${this.apiUrl}/getSalesValue/yearly`, { headers });
    }

    getTopSellingWeekly(): Observable<TopSellingProduct[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<TopSellingProduct[]>(`${this.apiUrl}/getTopSellingWeekly`, { headers });
    }

    getTopSellingMonthly(): Observable<TopSellingProduct[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<TopSellingProduct[]>(`${this.apiUrl}/getTopSellingMonthly`, { headers });
    }

    getTopSellingYearly(): Observable<TopSellingProduct[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<TopSellingProduct[]>(`${this.apiUrl}/getTopSellingYearly`, { headers });
    }
}