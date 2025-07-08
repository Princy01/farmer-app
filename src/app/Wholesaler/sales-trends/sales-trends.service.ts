import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

    constructor(private http: HttpClient) { }

    getMonthlySales(wholesalerId: number): Observable<SalesTrend[]> {
        return this.http.get<SalesTrend[]>(`${this.apiUrl}/getSalesValue/monthly/${wholesalerId}`);
    }

    getWeeklySales(wholesalerId: number): Observable<SalesTrend[]> {
        return this.http.get<SalesTrend[]>(`${this.apiUrl}/getSalesValue/weekly/${wholesalerId}`);
    }

    getYearlySales(wholesalerId: number): Observable<SalesTrend[]> {
        return this.http.get<SalesTrend[]>(`${this.apiUrl}/getSalesValue/yearly/${wholesalerId}`);
    }

    getTopSellingDaily(wholesalerId: number): Observable<TopSellingProduct[]> {
        return this.http.get<TopSellingProduct[]>(`${this.apiUrl}/getTopSellingDaily/${wholesalerId}`);
    }

    getTopSellingWeekly(wholesalerId: number): Observable<TopSellingProduct[]> {
        return this.http.get<TopSellingProduct[]>(`${this.apiUrl}/getTopSellingWeekly/${wholesalerId}`);
    }

    getTopSellingMonthly(wholesalerId: number): Observable<TopSellingProduct[]> {
        return this.http.get<TopSellingProduct[]>(`${this.apiUrl}/getTopSellingMonthly/${wholesalerId}`);
    }

    getTopSellingYearly(wholesalerId: number): Observable<TopSellingProduct[]> {
        return this.http.get<TopSellingProduct[]>(`${this.apiUrl}/getTopSellingYearly/${wholesalerId}`);
    }
}