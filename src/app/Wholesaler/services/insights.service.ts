import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout, retry, shareReplay, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

/**
 * Bulk Order Market Data
 */
export interface BulkOrderData {
  retailer: string;
  wholesaler: string;
  product: string;
  quantity: number;
  price: number;
  date: string;
}

/**
 * Top Retailers Summary
 */
export interface TopRetailerData {
  name: string;
  total: number;
}

/**
 * Market Insights Service
 *
 * Provides access to market data including bulk orders and top retailers.
 * All API calls include:
 * - Authentication token
 * - 30-second timeout
 * - Exponential backoff retry (3 attempts)
 * - Response caching to reduce API calls
 * - Proper error handling with user-friendly messages
 */
@Injectable({ providedIn: 'root' })
export class InsightsService {
  private apiUrl = environment.apiUrl;
  private readonly HTTP_TIMEOUT_MS = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000; // 1 second base delay

  // Cache for market data (5-minute TTL for real-time relevance)
  private bulkOrdersCache: { data: BulkOrderData[], timestamp: number } | null = null;
  private topRetailersCache: { data: TopRetailerData[], timestamp: number } | null = null;
  private premiumStatusCache: { data: boolean, timestamp: number } | null = null;

  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

  /**
   * Check if cache is still valid (within TTL)
   * @param timestamp Cache timestamp
   * @returns true if cache is still fresh
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL_MS;
  }

  /**
   * Exponential backoff delay calculation
   * @param attempt Current attempt number (0-indexed)
   * @returns Delay in milliseconds
   */
  private getExponentialBackoffDelay(attempt: number): number {
    return this.RETRY_DELAY_MS * Math.pow(2, attempt);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while fetching market data.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = 'Network error. Please check your internet connection.';
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'Network timeout. Please check your internet connection.';
          break;
        case 401:
          errorMessage = 'Session expired. Please login again.';
          break;
        case 403:
          errorMessage = 'You do not have access to market insights.';
          break;
        case 404:
          errorMessage = 'Market data not available.';
          break;
        case 500:
        case 502:
        case 503:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = 'An error occurred. Please try again later.';
      }
    }

    return throwError(() => ({ message: errorMessage, status: error.status, originalError: error }));
  }

  /**
   * Gets bulk orders market data with caching and proper error handling
   * @returns Observable of bulk order data
   */
  getBulkOrders(): Observable<BulkOrderData[]> {
    // Check cache first
    if (this.bulkOrdersCache && this.isCacheValid(this.bulkOrdersCache.timestamp)) {
      return new Observable(observer => {
        observer.next(this.bulkOrdersCache!.data);
        observer.complete();
      });
    }

    const headers = this.getAuthHeaders();
    return this.http.get<BulkOrderData[]>(
      `${this.apiUrl}/getBulkOrders`,
      { headers }
    ).pipe(
      timeout(this.HTTP_TIMEOUT_MS),
      retry({
        count: this.MAX_RETRIES,
        delay: (error, retryCount) => {
          const backoffDelay = this.getExponentialBackoffDelay(retryCount);
          return new Promise<void>(resolve => setTimeout(() => resolve(), backoffDelay));
        }
      }),
      map((data: BulkOrderData[]) => {
        // Cache the results
        this.bulkOrdersCache = {
          data,
          timestamp: Date.now()
        };
        return data;
      }),
      catchError(this.handleError.bind(this)),
      shareReplay(1)
    );
  }

  /**
   * Gets top retailers summary data with caching and proper error handling
   * @returns Observable of top retailer data
   */
  getTopRetailers(): Observable<TopRetailerData[]> {
    // Check cache first
    if (this.topRetailersCache && this.isCacheValid(this.topRetailersCache.timestamp)) {
      return new Observable(observer => {
        observer.next(this.topRetailersCache!.data);
        observer.complete();
      });
    }

    const headers = this.getAuthHeaders();
    return this.http.get<TopRetailerData[]>(
      `${this.apiUrl}/getTopRetailers`,
      { headers }
    ).pipe(
      timeout(this.HTTP_TIMEOUT_MS),
      retry({
        count: this.MAX_RETRIES,
        delay: (error, retryCount) => {
          const backoffDelay = this.getExponentialBackoffDelay(retryCount);
          return new Promise<void>(resolve => setTimeout(() => resolve(), backoffDelay));
        }
      }),
      map((data: TopRetailerData[]) => {
        // Cache the results
        this.topRetailersCache = {
          data,
          timestamp: Date.now()
        };
        return data;
      }),
      catchError(this.handleError.bind(this)),
      shareReplay(1)
    );
  }

  /**
   * Checks if the current wholesaler has premium status
   * @returns Observable of premium status boolean
   */
  isPremium(): Observable<boolean> {
    // Check cache first
    if (this.premiumStatusCache && this.isCacheValid(this.premiumStatusCache.timestamp)) {
      return new Observable(observer => {
        observer.next(this.premiumStatusCache!.data);
        observer.complete();
      });
    }

    const headers = this.getAuthHeaders();
    return this.http.get<{ isPremium: boolean }>(
      `${this.apiUrl}/user/premium-status`,
      { headers }
    ).pipe(
      timeout(this.HTTP_TIMEOUT_MS),
      retry({
        count: this.MAX_RETRIES,
        delay: (error, retryCount) => {
          const backoffDelay = this.getExponentialBackoffDelay(retryCount);
          return new Promise<void>(resolve => setTimeout(() => resolve(), backoffDelay));
        }
      }),
      map((response: { isPremium: boolean }) => {
        const isPremium = response.isPremium === true;
        // Cache the result
        this.premiumStatusCache = {
          data: isPremium,
          timestamp: Date.now()
        };
        return isPremium;
      }),
      catchError(this.handleError.bind(this)),
      shareReplay(1)
    );
  }

  /**
   * Clear all cached data (call on logout or session change)
   */
  clearCache(): void {
    this.bulkOrdersCache = null;
    this.topRetailersCache = null;
    this.premiumStatusCache = null;
  }
}
