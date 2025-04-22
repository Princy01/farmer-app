import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SalesTrend {
    month_year: string;
    total_orders: number;
    total_revenue: number;
}

export interface TopSellingProduct extends SalesTrend {
    // Inherits all properties from SalesTrend
}

const API_BASE_URL = 'http://127.0.0.1:3000';

@Injectable({
    providedIn: 'root'
})
export class SalesTrendsService {

    constructor(private http: HttpClient) { }

    getMonthlySales(): Observable<SalesTrend[]> {
        return this.http.get<SalesTrend[]>(`${API_BASE_URL}/getSalesValue/monthly`);
    }

    getWeeklySales(): Observable<SalesTrend[]> {
        return this.http.get<SalesTrend[]>(`${API_BASE_URL}/getSalesValue/weekly`);
    }

    getYearlySales(): Observable<SalesTrend[]> {
        return this.http.get<SalesTrend[]>(`${API_BASE_URL}/getSalesValue/yearly`);
    }

    getTopSellingDaily(): Observable<TopSellingProduct[]> {
        return this.http.get<TopSellingProduct[]>(`${API_BASE_URL}/getTopSellingDaily`);
    }

    getTopSellingWeekly(): Observable<TopSellingProduct[]> {
        return this.http.get<TopSellingProduct[]>(`${API_BASE_URL}/getTopSellingWeekly`);
    }

    getTopSellingMonthly(): Observable<TopSellingProduct[]> {
        return this.http.get<TopSellingProduct[]>(`${API_BASE_URL}/getTopSellingMonthly`);
    }

    getTopSellingYearly(): Observable<TopSellingProduct[]> {
        return this.http.get<TopSellingProduct[]>(`${API_BASE_URL}/getTopSellingYearly`);
    }
}