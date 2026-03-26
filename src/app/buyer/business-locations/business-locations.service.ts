import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { timeout, retry, catchError, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

const HTTP_TIMEOUT_MS = 30000; // 30 seconds
const RETRY_ATTEMPTS = 3;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface BusinessLocation {
    branch_id: number;
    bid: number;
    shop_name: string;
    type_id: number;
    location: number;
    state: number;
    b_city_id: number;
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

export interface BusinessBranchWithNames {
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
    latitude: number;
    longitude: number;
    image: string;
}

export interface BusinessBranchRequest {
    branch_id?: number;
    bid?: number;
    shop_name: string;
    type_id: number;
    location: number;
    state: number;
    b_city_id: number;
    address: string;
    email: string;
    number: string;
    gst_num: string;
    pan_num: string;
    privilege_user: boolean;
    established_year: string;
    active_status: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class BusinessLocationsService {
    private apiUrl = environment.apiUrl;
    private businessesCache$: Observable<BusinessBranchWithNames[]> | null = null;
    private cacheTimestamp = 0;

    constructor(private http: HttpClient, private authService: AuthService) { }

    private getAuthHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });
    }

    getAllBusinessesOfUser(): Observable<BusinessLocation[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<BusinessLocation[]>(`${this.apiUrl}/getAllBusinessBranchesByUser`, { headers })
            .pipe(
                timeout(HTTP_TIMEOUT_MS),
                retry({
                    count: RETRY_ATTEMPTS,
                    delay: (error, retryCount) => {
                        // Exponential backoff: 1s, 2s, 4s
                        const delayMs = Math.min(1000 * Math.pow(2, retryCount - 1), 4000);
                        return new Observable(observer => {
                            setTimeout(() => observer.next(), delayMs);
                        });
                    }
                })
            );
    }

    getAllBusinessesWithNameOfUser(): Observable<BusinessBranchWithNames[]> {
            // Return cached data if still valid
            if (this.businessesCache$ && Date.now() - this.cacheTimestamp < CACHE_DURATION_MS) {
                return this.businessesCache$;
            }

            const headers = this.getAuthHeaders();
            this.businessesCache$ = this.http.get<BusinessBranchWithNames[]>(
                `${this.apiUrl}/getAllBusinessBranchesWithNamesByUser`,
                { headers }
            ).pipe(
                timeout(HTTP_TIMEOUT_MS),
                retry({
                    count: RETRY_ATTEMPTS,
                    delay: (error, retryCount) => {
                        // Exponential backoff: 1s, 2s, 4s
                        const delayMs = Math.min(1000 * Math.pow(2, retryCount - 1), 4000);
                        return new Observable(observer => {
                            setTimeout(() => observer.next(), delayMs);
                        });
                    }
                }),
                shareReplay(1),
                catchError((error) => {
                    // Clear cache on error so next request retries
                    this.businessesCache$ = null;
                    throw error;
                })
            );

            this.cacheTimestamp = Date.now();
            return this.businessesCache$;
        }

        /**
         * Clear cached business data (call on logout or session change)
         */
        clearCache(): void {
            this.businessesCache$ = null;
            this.cacheTimestamp = 0;
        }
}
