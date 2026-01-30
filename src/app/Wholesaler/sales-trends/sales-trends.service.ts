import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
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

    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'An error occurred while fetching data.';

        if (error.error instanceof ErrorEvent) {
            // Client-side or network error
            errorMessage = `Network error: ${error.error.message}`;
        } else {
            // Backend returned an unsuccessful response code
            switch (error.status) {
                case 401:
                    errorMessage = 'Unauthorized. Please login again.';
                    break;
                case 403:
                    errorMessage = 'Access denied. Insufficient permissions.';
                    break;
                case 404:
                    errorMessage = 'Requested data not found.';
                    break;
                case 500:
                    errorMessage = 'Server error. Please try again later.';
                    break;
                default:
                    errorMessage = `Server returned code ${error.status}: ${error.message}`;
            }
        }

        console.error('API Error:', errorMessage, error);
        return throwError(() => error);
    }

    getMonthlySales(): Observable<SalesTrend[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<SalesTrend[]>(`${this.apiUrl}/getSalesValue/monthly`, { headers }).pipe(
            retry(1),
            catchError(this.handleError.bind(this))
        );
    }

    getWeeklySales(): Observable<SalesTrend[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<SalesTrend[]>(`${this.apiUrl}/getSalesValue/weekly`, { headers }).pipe(
            retry(1),
            catchError(this.handleError.bind(this))
        );
    }

    getYearlySales(): Observable<SalesTrend[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<SalesTrend[]>(`${this.apiUrl}/getSalesValue/yearly`, { headers }).pipe(
            retry(1),
            catchError(this.handleError.bind(this))
        );
    }

    getTopSellingWeekly(): Observable<TopSellingProduct[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<TopSellingProduct[]>(`${this.apiUrl}/getTopSellingWeekly`, { headers }).pipe(
            retry(1),
            catchError(this.handleError.bind(this))
        );
    }

    getTopSellingMonthly(): Observable<TopSellingProduct[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<TopSellingProduct[]>(`${this.apiUrl}/getTopSellingMonthly`, { headers }).pipe(
            retry(1),
            catchError(this.handleError.bind(this))
        );
    }

    getTopSellingYearly(): Observable<TopSellingProduct[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<TopSellingProduct[]>(`${this.apiUrl}/getTopSellingYearly`, { headers }).pipe(
            retry(1),
            catchError(this.handleError.bind(this))
        );
    }
}