import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError, retry, timeout, shareReplay, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface Stock {
  id: number;
  productName: string;
  currentStock: number;
  price: number;
}

export interface ProductPriceData {
  product_id: number;
  product_name: string;
  category_id: number;
  category_name: string;
  price_per_unit: number;
  current_stock: number;
  unit_id: number;
  units_name: string;
  last_date_of_entry: string;
}

export interface BusinessBranchWithNames {
  branch_id: number;
  shop_name: string;
  location_name: string;
  state_name: string;
  city_name: string;
  address: string;
}

export interface AddStockPayload {
  product_id: number;
  quality_id: number;
  wastage_measure_id: number;
  stock_received: number;
  stock_carried_forward: number;
  price_per_unit: number;
  b_b_id: number;
  date_of_entry: string;
  unit_id: number;
}

export interface UpdateStockPayload {
  product_id: number;
  new_quantity: number;
  mandi_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = environment.apiUrl;
  private readonly HTTP_TIMEOUT_MS = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000; // 1 second base delay

  // Cache for reference data (24-hour TTL)
  private branchesCache: { [userId: number]: { data: BusinessBranchWithNames[], timestamp: number } } = {};
  private productsCache: { data: any[], timestamp: number } | null = null;
  private qualitiesCache: { data: any[], timestamp: number } | null = null;
  private wastageMeasuresCache: { data: any[], timestamp: number } | null = null;
  private unitsCache: { data: any[], timestamp: number } | null = null;

  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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
    let errorMessage = 'An error occurred while processing your request.';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = 'Network error. Please check your internet connection.';
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
          errorMessage = 'Resource not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        case 0:
          // Network timeout or no internet
          errorMessage = 'Network timeout. Please check your internet connection.';
          break;
        default:
          errorMessage = 'An error occurred. Please try again.';
      }
    }

    return throwError(() => ({ message: errorMessage, status: error.status, originalError: error }));
  }

  /**
   * Retry logic with exponential backoff: 1s -> 2s -> 4s
   * @param attempt Current attempt number (0-indexed)
   * @returns Delay in milliseconds
   */
  private getExponentialBackoffDelay(attempt: number): number {
    return this.RETRY_DELAY_MS * Math.pow(2, attempt);
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
   * Store data in cache for reference data (24-hour TTL)
   * @param cacheObject The cache object to store
   * @param data The data to cache
   */
  private storeInCache<T>(cacheObject: { data: T[], timestamp: number } | null, data: T[]): { data: T[], timestamp: number } {
    return {
      data,
      timestamp: Date.now()
    };
  }

  /**
   * Clear all caches (e.g., on logout or session change)
   */
  clearCache(): void {
    this.branchesCache = {};
    this.productsCache = null;
    this.qualitiesCache = null;
    this.wastageMeasuresCache = null;
    this.unitsCache = null;
  }

  getProductsStockOfBranchForDate(branchId: number, date: string): Observable<ProductPriceData[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ProductPriceData[]>(
      `${this.apiUrl}/getAllProductsStockOfBusinessBranchOfTheDate/${branchId}/${date}`,
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
      catchError(this.handleError.bind(this))
    );
  }

  getBranchesByUser(userId: number): Observable<BusinessBranchWithNames[]> {
    // Check cache first
    const cachedData = this.branchesCache[userId];
    if (cachedData && this.isCacheValid(cachedData.timestamp)) {
      return new Observable(observer => {
        observer.next(cachedData.data);
        observer.complete();
      });
    }

    const headers = this.getAuthHeaders();
    return this.http.get<BusinessBranchWithNames[]>(
      `${this.apiUrl}/getAllBusinessBranchesWithNamesByUser?userId=${userId}`,
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
      catchError(this.handleError.bind(this)),
      shareReplay(1)
    ).pipe(
      tap((data: BusinessBranchWithNames[]) => {
        this.branchesCache[userId] = {
          data,
          timestamp: Date.now()
        };
      })
    );
  }

  addStock(data: AddStockPayload): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(
      `${this.apiUrl}/addStockPriceDataForBusinessBranch`,
      data,
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
      catchError(this.handleError.bind(this))
    );
  }

  updateStock(data: UpdateStockPayload): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(
      `${this.apiUrl}/wholesaler/product/update-stock-mandi`,
      data,
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
      catchError(this.handleError.bind(this))
    );
  }

  getProducts(): Observable<any[]> {
    // Check cache first
    if (this.productsCache && this.isCacheValid(this.productsCache.timestamp)) {
      return new Observable(observer => {
        observer.next(this.productsCache!.data);
        observer.complete();
      });
    }

    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(
      `${this.apiUrl}/getAllProducts`,
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
      catchError(this.handleError.bind(this)),
      shareReplay(1),
      tap((data: any[]) => {
        this.productsCache = {
          data,
          timestamp: Date.now()
        };
      })
    );
  }

  getQualities(): Observable<any[]> {
    // Check cache first
    if (this.qualitiesCache && this.isCacheValid(this.qualitiesCache.timestamp)) {
      return new Observable(observer => {
        observer.next(this.qualitiesCache!.data);
        observer.complete();
      });
    }

    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(
      `${this.apiUrl}/getAllQualityLevels`,
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
      catchError(this.handleError.bind(this)),
      shareReplay(1),
      tap((data: any[]) => {
        this.qualitiesCache = {
          data,
          timestamp: Date.now()
        };
      })
    );
  }

  getWastageMeasures(): Observable<any[]> {
    // Check cache first
    if (this.wastageMeasuresCache && this.isCacheValid(this.wastageMeasuresCache.timestamp)) {
      return new Observable(observer => {
        observer.next(this.wastageMeasuresCache!.data);
        observer.complete();
      });
    }

    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(
      `${this.apiUrl}/getAllWastageMeasures`,
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
      catchError(this.handleError.bind(this)),
      shareReplay(1),
      tap((data: any[]) => {
        this.wastageMeasuresCache = {
          data,
          timestamp: Date.now()
        };
      })
    );
  }

  getUnits(): Observable<any[]> {
    // Check cache first
    if (this.unitsCache && this.isCacheValid(this.unitsCache.timestamp)) {
      return new Observable(observer => {
        observer.next(this.unitsCache!.data);
        observer.complete();
      });
    }

    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(
      `${this.apiUrl}/getAllUnits`,
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
      catchError(this.handleError.bind(this)),
      shareReplay(1),
      tap((data: any[]) => {
        this.unitsCache = {
          data,
          timestamp: Date.now()
        };
      })
    );
  }
}