import { Injectable } from '@angular/core';
import { Observable, throwError, timer } from 'rxjs';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError, retryWhen, concatMap, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';
import { RetailerOrderHistoryResponse } from '../retailer-order-history/retailer-order-history.service';

export interface Category {
  category_id: number;
  category_name: string;
  super_cat_id?: number;
  img_path?: string;
  active_status?: number;
  category_regional_id?: number;
}

export interface PaymentMode {
  id: number;
  payment_mode: string;
}

export interface Product {
  nutrition_factor: string;
  description: string;
  product_id: number;
  category_id: number;
  category_name: string;
  product_name: string;
  image_path: string;
  active_status: number;
  product_regional_id: number;
  product_regional_name: string;
}

export interface ProductRegional {
  id: number;
  language_id: number;
  product_id: number;
  product_name: string;
  product_regional_name: string;
}

export interface CategoryRegionalLanguage {
  id: number;
  language_id: number;
  regional_name: string;
}

export interface CategoryWithSubCategories {
  subcategories: Category[];
  category_id: number;
  category_name: string;
  super_cat_id?: number;
  img_path?: string;
  active_status?: number;
  category_regional_id?: number;
}

export interface ProductAll {
  product_id: number;
  product_name: string;
  cat_id: number;
  cat_name: string;
  image_path: string;
  active_status: number;
  nutrition_factor: string;
  description?: string;
}
 //TRANSLATION RELATED INTERFACES
interface Language {
  id: number;
  code: string;
  name: string;
}

interface UserPreference {
  language: string;
}

export interface RetailerSpendsQuery {
  from?: string;
  to?: string;
  status?: 'all' | 'paid' | 'pending' | 'failed' | 'cancelled' | 'refunded';
}

export interface RetailerSpendsSummary {
  from_date?: string;
  to_date?: string;
  status: string;
  gross_amount: number;
  paid_amount: number;
  net_spend_amount: number;
  goods_amount: number;
  delivery_amount: number;
  platform_fee_amount: number;
  handling_fee_amount?: number;
  refunded_amount: number;
  pending_amount: number;
  failed_amount: number;
  payment_intent_count: number;
  order_count: number;
  timezone: string;
  generated_at: string;
}

export interface RetailerSpendsDay {
  date: string;
  payment_intent_count: number;
  order_count: number;
  paid_count?: number;
  gross_amount: number;
  paid_amount: number;
  net_spend_amount: number;
  pending_amount: number;
  refunded_amount: number;
}

export interface RetailerSpendsPayment {
  payment_intent_id: number;
  checkout_session_id?: number;
  provider_payment_id?: string;
  provider_order_id?: string;
  order_ids: number[];
  order_numbers?: string;
  event_date?: string;
  initiated_at?: string;
  collected_at?: string;
  failed_at?: string;
  status: string;
  status_label: string;
  branch_name?: string;
  delivery_address?: string;
  goods_amount: number;
  delivery_amount: number;
  platform_fee_amount: number;
  refunded_amount: number;
  gross_amount: number;
  paid_amount: number;
  net_spend_amount?: number;
  pending_amount: number;
  failed_amount: number;
  difference_amount?: number;
  reason_summary?: string;
  failure_reason?: string;
}

export interface RetailerSpendsItem {
  order_id: number;
  product_id?: number;
  product_name: string;
  branch_name?: string;
  quantity: number;
  unit_name?: string;
  price_per_unit: number;
  line_amount: number;
}

export interface RetailerSpendsPaymentsResponse {
  items: RetailerSpendsPayment[];
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface RetailerSpendsPaymentDetail {
  payment: RetailerSpendsPayment;
  items: RetailerSpendsItem[];
}

@Injectable({
  providedIn: 'root'
})
export class BuyerApiService {
  private readonly apiUrl = environment.apiUrl;
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Applies exponential backoff retry logic to observable
   * Retries on network errors, timeouts, and 5xx status codes
   */
  private applyRetryLogic<T>(observable: Observable<T>): Observable<T> {
    return observable.pipe(
      timeout(this.REQUEST_TIMEOUT),
      retryWhen(errors =>
        errors.pipe(
          concatMap((err, idx) => {
            if (idx < this.MAX_RETRIES && this.isRetryableError(err)) {
              const delay = Math.pow(2, idx) * 1000; // 1s, 2s, 4s
              return timer(delay);
            }
            return throwError(() => err);
          })
        )
      ),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Determines if an error is retryable (network, timeout, 5xx errors)
   */
  private isRetryableError(error: any): boolean {
    if (error.name === 'TimeoutError') return true;
    if (error.status >= 500) return true;
    if (error.status === 0) return true; // Network error
    return false;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'ERRORS.UNKNOWN_ERROR';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = 'ERRORS.NETWORK_ERROR';
    } else {
      // Backend error
      switch (error.status) {
        case 400:
          errorMessage = 'ERRORS.BAD_REQUEST';
          break;
        case 401:
          errorMessage = 'ERRORS.UNAUTHORIZED';
          break;
        case 403:
          errorMessage = 'ERRORS.FORBIDDEN';
          break;
        case 404:
          errorMessage = 'ERRORS.NOT_FOUND';
          break;
        case 500:
          errorMessage = 'ERRORS.SERVER_ERROR';
          break;
        case 503:
          errorMessage = 'ERRORS.SERVICE_UNAVAILABLE';
          break;
        default:
          errorMessage = 'ERRORS.UNKNOWN_ERROR';
      }
    }

    return throwError(() => ({ message: errorMessage, status: error.status }));
  }

  getCategoryBySuperCategoryId(superCatId: number): Observable<Category[]> {
    if (!superCatId || superCatId <= 0) {
      return throwError(() => ({ message: 'ERRORS.INVALID_CATEGORY_ID', status: 400 }));
    }

    return this.applyRetryLogic(
      this.http.get<Category[]>(`${this.apiUrl}/getCategoriesBySupID/${superCatId}`)
    );
  }

  getProductsByCategoryId(categoryId: number): Observable<Product[]> {
    if (!categoryId || categoryId <= 0) {
      return throwError(() => ({ message: 'ERRORS.INVALID_CATEGORY_ID', status: 400 }));
    }

    return this.applyRetryLogic(
      this.http.get<Product[]>(`${this.apiUrl}/getProductByCatId/${categoryId}`)
    );
  }

  getAllProductsOfSuperCategory(superCatId: number): Observable<ProductAll[]> {
    if (!superCatId || superCatId <= 0) {
      return throwError(() => ({ message: 'ERRORS.INVALID_CATEGORY_ID', status: 400 }));
    }

    return this.applyRetryLogic(
      this.http.get<ProductAll[]>(`${this.apiUrl}/getAllProductsOfSuperCategory/${superCatId}`)
    );
  }

  getCategories(): Observable<Category[]> {
    return this.applyRetryLogic(
      this.http.get<Category[]>(`${this.apiUrl}/getCategories`)
    );
  }

  getCategoryById(categoryId: number): Observable<CategoryWithSubCategories> {
    if (!categoryId || categoryId <= 0) {
      return throwError(() => ({ message: 'ERRORS.INVALID_CATEGORY_ID', status: 400 }));
    }

    return this.applyRetryLogic(
      this.http.get<CategoryWithSubCategories>(`${this.apiUrl}/getCategories/${categoryId}`)
    );
  }

  getProductRegionalNameById(id: number): Observable<ProductRegional> {
    if (!id || id <= 0) {
      return throwError(() => ({ message: 'ERRORS.INVALID_ID', status: 400 }));
    }

    return this.applyRetryLogic(
      this.http.get<ProductRegional>(`${this.apiUrl}/getProductCategoryRegionalName/${id}`)
    );
  }

  getAllProducts(): Observable<Product[]> {
    return this.applyRetryLogic(
      this.http.get<Product[]>(`${this.apiUrl}/getProducts`)
    );
  }

  getProductById(productId: number): Observable<Product> {
    if (!productId || productId <= 0) {
      return throwError(() => ({ message: 'ERRORS.INVALID_PRODUCT_ID', status: 400 }));
    }

    return this.applyRetryLogic(
      this.http.get<Product>(`${this.apiUrl}/getProducts/${productId}`)
    );
  }

  getProductCategoryRegionalById(id: number): Observable<CategoryRegionalLanguage> {
    if (!id || id <= 0) {
      return throwError(() => ({ message: 'ERRORS.INVALID_ID', status: 400 }));
    }

    return this.applyRetryLogic(
      this.http.get<CategoryRegionalLanguage>(`${this.apiUrl}/getProductCategoryRegional/${id}`)
    );
  }

  getModeOfPayments(): Observable<PaymentMode[]> {
    return this.applyRetryLogic(
      this.http.get<PaymentMode[]>(`${this.apiUrl}/getModeOfPayments`)
    );
  }

  getSuperCategories(): Observable<Category[]> {
    return this.applyRetryLogic(
      this.http.get<Category[]>(`${this.apiUrl}/getSuperCategories`)
    );
  }

  getOrderHistory(): Observable<RetailerOrderHistoryResponse> {
    return this.applyRetryLogic(
      this.http.get<RetailerOrderHistoryResponse>(
        `${this.apiUrl}/order_history`,
        { headers: this.getAuthHeaders() }
      )
    );
  }

  // Transport and Delivery APIs
  getRouteMetrics(
    pickupLat: number,
    pickupLon: number,
    dropLat: number,
    dropLon: number
  ): Observable<{ distance_meters: number; duration_seconds: number }> {
    const payload = {
      pickup_lat: pickupLat,
      pickup_lon: pickupLon,
      drop_lat: dropLat,
      drop_lon: dropLon
    };

    return this.applyRetryLogic(
      this.http.post<{ distance_meters: number; duration_seconds: number }>(
        `${this.apiUrl}/transportation/requests/route-metrics`,
        payload,
        { headers: new HttpHeaders({ 'Authorization': `Bearer ${this.authService.getToken()}` }) }
      )
    );
  }

  calculateTransportJobPrice(
    jobId: number,
    distance: number
  ): Observable<{ job_id: number; price: number }> {
    const payload = {
      job_id: jobId,
      distance: distance
    };

    return this.applyRetryLogic(
      this.http.post<{ job_id: number; price: number }>(
        `${this.apiUrl}/transportation/requests/calculate-transport-job-price`,
        payload,
        { headers: new HttpHeaders({ 'Authorization': `Bearer ${this.authService.getToken()}` }) }
      )
    );
  }

  calculateTransportPricePreview(
    distance: number,
    weight: number,
    deliveryType: string,
    cityCode: string,
    cityName: string,
    loadType: string = 'general'
  ): Observable<{ price: number; vehicle_type: string }> {
    const payload = {
      distance,
      weight,
      delivery_type: deliveryType,
      city_code: cityCode,
      city_name: cityName,
      load_type: loadType
    };

    return this.applyRetryLogic(
      this.http.post<{ price: number; vehicle_type: string }>(
        `${this.apiUrl}/transportation/requests/calculate-transport-price-preview`,
        payload,
        { headers: new HttpHeaders({ 'Authorization': `Bearer ${this.authService.getToken()}` }) }
      )
    );
  }

  getRetailerSpendsSummary(query: RetailerSpendsQuery = {}): Observable<RetailerSpendsSummary> {
    return this.applyRetryLogic(
      this.http.get<RetailerSpendsSummary>(
        `${this.apiUrl}/retailer/spends/summary`,
        { headers: this.getAuthHeaders(), params: this.buildSpendsParams(query) }
      )
    );
  }

  getRetailerSpendsDays(query: RetailerSpendsQuery = {}): Observable<RetailerSpendsDay[]> {
    return this.applyRetryLogic(
      this.http.get<RetailerSpendsDay[]>(
        `${this.apiUrl}/retailer/spends/days`,
        { headers: this.getAuthHeaders(), params: this.buildSpendsParams(query) }
      )
    );
  }

  getRetailerSpendsPayments(
    query: RetailerSpendsQuery & { date?: string; page?: number; page_size?: number } = {}
  ): Observable<RetailerSpendsPaymentsResponse> {
    return this.applyRetryLogic(
      this.http.get<RetailerSpendsPaymentsResponse>(
        `${this.apiUrl}/retailer/spends/payments`,
        { headers: this.getAuthHeaders(), params: this.buildSpendsParams(query) }
      )
    );
  }

  getRetailerSpendsPaymentDetail(orderId: number): Observable<RetailerSpendsPaymentDetail> {
    return this.applyRetryLogic(
      this.http.get<RetailerSpendsPaymentDetail>(
        `${this.apiUrl}/retailer/spends/orders/${orderId}`,
        { headers: this.getAuthHeaders() }
      )
    );
  }

  private buildSpendsParams(query: RetailerSpendsQuery & Record<string, any>): Record<string, string> {
    const params: Record<string, string> = {};
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = String(value);
      }
    });
    return params;
  }
}
