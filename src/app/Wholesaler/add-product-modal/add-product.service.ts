import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, OperatorFunction, throwError, timer } from 'rxjs';
import { catchError, timeout, retryWhen, concatMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface ProductAll {
  product_id: number;
  product_name: string;
  cat_id: number;
  cat_name: string;
  image_path: string | null;
  active_status: number;
  nutrition_factor: string;
}

export interface Unit {
  unit_id: number;
  units_name: string;
}

export interface Quality {
  quality_id: number;
  quality_name: string;
}

export interface WastageMeasure {
  id: number;
  wastage_measure_name: string;
}

@Injectable({ providedIn: 'root' })
export class AddProductService {
  private apiUrl = environment.apiUrl;
  private readonly HTTP_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Gets authorization headers with Bearer token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Exponential backoff retry strategy for failed requests
   * Waits 1s, 2s, 4s before giving up
   */
  private exponentialBackoff<T>(): OperatorFunction<T, T> {
    return retryWhen(errors =>
      errors.pipe(
        concatMap((err, idx) => {
          if (idx < this.MAX_RETRIES) {
            const delayMs = Math.pow(2, idx) * 1000;
            return timer(delayMs);
          }
          return throwError(() => err);
        })
      )
    );
  }

  /**
   * Handles HTTP errors and maps them to user-friendly messages
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'ADD_PRODUCT.ERROR_UNKNOWN';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = 'ADD_PRODUCT.ERROR_CLIENT';
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'ADD_PRODUCT.ERROR_UNAUTHORIZED';
          break;
        case 403:
          errorMessage = 'ADD_PRODUCT.ERROR_FORBIDDEN';
          break;
        case 404:
          errorMessage = 'ADD_PRODUCT.ERROR_NOT_FOUND';
          break;
        case 500:
          errorMessage = 'ADD_PRODUCT.ERROR_SERVER';
          break;
        default:
          errorMessage = 'ADD_PRODUCT.ERROR_UNKNOWN';
      }
    }

    return throwError(() => ({ message: errorMessage, originalError: error }));
  }

  /**
   * Fetches all products for admin with retry and timeout
   */
  getAllProductsForAdmin(): Observable<ProductAll[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ProductAll[]>(`${this.apiUrl}/getAllProductsForAdmin`, { headers })
      .pipe(
        timeout(this.HTTP_TIMEOUT),
        this.exponentialBackoff(),
        catchError(this.handleError.bind(this))
      ) as Observable<ProductAll[]>;
  }

  /**
   * Adds a product to a branch with retry and timeout
   */
  addProductToBranch(
    bid: number,
    productId: number,
    qualityId: number,
    wastageMeasureId: number,
    currentStock: number,
    pricePerUnit: number,
    unitId: number
  ): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = {
      bid,
      product_id: productId,
      quality_id: qualityId,
      wastage_measure_id: wastageMeasureId,
      current_stock: currentStock,
      price_per_unit: pricePerUnit,
      unit_id: unitId
    };
    return this.http
      .post<any>(`${this.apiUrl}/branch/product`, body, { headers })
      .pipe(
        timeout(this.HTTP_TIMEOUT),
        this.exponentialBackoff(),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Fetches all available units with timeout
   */
  getAllUnits(): Observable<Unit[]> {
    return this.http
      .get<Unit[]>(`${this.apiUrl}/getAllUnits`)
      .pipe(
        timeout(this.HTTP_TIMEOUT),
        catchError(this.handleError.bind(this))
      ) as Observable<Unit[]>;
  }

  /**
   * Fetches all quality levels with retry and timeout
   */
  getAllQualities(): Observable<Quality[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Quality[]>(`${this.apiUrl}/qualities`, { headers })
      .pipe(
        timeout(this.HTTP_TIMEOUT),
        this.exponentialBackoff(),
        catchError(this.handleError.bind(this))
      ) as Observable<Quality[]>;
  }

  /**
   * Fetches all wastage measures with retry and timeout
   */
  getAllWastageMeasures(): Observable<WastageMeasure[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<WastageMeasure[]>(`${this.apiUrl}/wastage-measures`, { headers })
      .pipe(
        timeout(this.HTTP_TIMEOUT),
        this.exponentialBackoff(),
        catchError(this.handleError.bind(this))
      ) as Observable<WastageMeasure[]>;
  }
}