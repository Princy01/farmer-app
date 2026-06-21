import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer, MonoTypeOperatorFunction } from 'rxjs';
import { map, catchError, retryWhen, concatMap, finalize, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';
import { OrderPostDeliveryStatus } from 'src/app/shared/order-post-delivery-status';


export interface ApiErrorResponse {
  error?: {
    message?: string;
    code?: string;
  };
  message?: string;
  statusCode?: number;
}

//  Order summary for home screen
interface OrderSummary {
  wholeseller_id: number;
  mandi_id: number;
  product_id: number;
  product_name: string;
  stock_left: number;
  stock_in: number;
}

//  Order item for My Orders screen
interface OrderItem {
  order_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_id: number;
  unit_name: string;
  max_item_price: number;
}

export interface OrderItemDetails {
  order_id: number;
  retailer_id: number;
  retailer_name: string;
  retailer_address: string;
  retailer_mobile: string;
  actual_delivery_date: string;
  order_status_id: number;
  order_status: string;
  total_order_amount: number;
  order_items: OrderItem[];
  created_at: string;
  post_delivery?: OrderPostDeliveryStatus | null;
}

//  Detailed order view for Order Details screen
interface OrderDetailedView extends OrderItemDetails {
  mandi_name: string;
  mandi_location: string;
  retailer_name: string;
  retailer_contact: string;
  order_date: string;
  order_status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'completed';
  delivery_date?: string;
  special_instructions?: string;
}

//  Response from create order API
interface CreateOrderResponse {
  order_id: number;
  status: string;
  message: string;
}

export interface OrderFullDetails {
  order_id: number;
  date_of_order: string;
  order_status: number;
  order_status_name?: string;
  actual_delivery_date?: string;

  retailer_id: number;
  retailer_name: string;
  retailer_address: string;
  retailer_mobile: string;

  total_order_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;

  products: ProductDetail[];
  transport?: OrderTransportStatus | null;
  post_delivery?: OrderPostDeliveryStatus | null;
}

export interface OrderTransportStatus {
  job_id?: number | null;
  job_status?: string;
  delivery_status?: string;
  cancelled_at?: string | null;
  status_label?: string;
  status_note?: string;
  needs_admin_action?: boolean;
}

export interface ProductDetail {
  order_item_id: number;
  product_id: number;
  product_name: string;
  category_id: number;
  category_name: string;
  quantity: number;
  unit_id: number;
  unit_name: string;
  max_item_price: number;
  branch_id?: number;
  branch_name?: string;
  branch_address?: string;
  branch_number?: string;
}

//  Mandi stock information
interface MandiStock {
  mandi_id: number;
  mandi_name: string;
  mandi_stock: number;
}

export interface RestockProduct {
  product_id: number;
  product_name: string;
  category_name: string;
  current_stock: number;
  sales_volume: number;
  stock_to_sales_ratio: number;
  stock_status: string;
  days_until_stockout: number;
  avg_daily_sales: number;
  recommended_restock_qty: number;
  branches: BranchStock[];
  sales_trend: WeeklyTrend[];
}

//  Bulk order item for market opportunities screen
interface BulkOrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price_of_product: number;
}

export interface BulkOrder {
  order_id: number;
  date_of_order: string;
  total_order_amount: number;
  retailer_name: string;
  wholeseller_name: string;
  items: BulkOrderItem[];
}

//  Response interface for retailer products (flat structure from API)
export interface RetailerProductResponse {
  retailer_id: number;
  retailer_name: string;
  product_id: number;
  product_name: string;
  unit_id: number;
  quantity: number;
  order_value: number;
}

//  Product information for a retailer
export interface RetailerProduct {
  product_id: number;
  product_name: string;
  unit_id: number;
  quantity: number;
  order_value: number;
}

//  Top retailer with aggregated product information
export interface TopRetailer {
  retailer_id: number;
  retailer_name: string;
  total_quantity: number;
  total_order_value: number;
  products: RetailerProduct[];
}

//  Request payload for creating an offer
export interface CreateOfferRequest {
  order_id: number;
  wholeseller_id: number;
  offered_price: number;
  proposed_delivery_date: string;
  message?: string;
}

//  Response from create offer API
export interface CreateOfferResponse {
  offer_id: number;
}

//  Wholesaler entry for sale screen
export interface WholesellerEntry {
  product_id: number;
  quality: string;
  wastage: string;
  quantity: number;
  price: number;
  datetime: string;
  wholeseller_id: number;
  mandi_id: number;
  warehouse_id: number;
  unit_id: number;
}

//  Response from wholesaler entry creation

export interface WholesellerEntryResponse {
  message: string;
  entry_id: number;
}

export interface CancelOrderResponse {
  status: string;
  message: string;
}

//  Mandi (market) information

export interface Mandi {
  mandi_id: number;
  mandi_location: string;
  mandi_incharge: string;
  mandi_incharge_num: string;
  mandi_pincode: string;
  mandi_address: string;
  mandi_state_id: number;
  state_name: string;
  state_shortnames: string;
  mandi_name: string;
  mandi_shortnames: string;
  mandi_city_id: number;
  city_name: string;
  city_shortnames: string;
}

interface Language {
  id: number;
  code: string;
  name: string;
}

//  Wholesaler product summary

export interface WholesalerProduct {
  product_id: number;
  product_name: string;
  total_stock: number;
  total_orders: number;
}

// Next-day demand info embedded in a wholesaler product (from products-with-demand endpoint)
export interface NextDayDemand {
  qty_needed: number;
  shortage: number;
}

// Wholesaler product with optional next-day demand info
export interface WholesalerProductWithDemand extends WholesalerProduct {
  next_day_demand?: NextDayDemand | null;
}

// Dashboard summary (home screen quick stats)
export interface WholesalerDashboardSummary {
  total_stock: number;
  active_orders: number;
  next_day_items_count: number;
  next_day_shortage_count: number;
}

// Single product entry in the next-day demand list
export interface WholesalerDemandProduct {
  product_id: number;
  product_name: string;
  total_stock: number;
  qty_needed: number;
  shortage: number;
}

// Single product entry in the past-demand list
export interface WholesalerPastDemandProduct {
  product_id: number;
  product_name: string;
  total_stock: number;
  total_ordered_quantity: number;
}

  // Detailed wholesaler product information

export interface WholesalerProductDetails {
  product_id: number;
  product_name: string;
  category_name: string;
  image_path?: string;
  price_per_unit: number;
  unit_name: string;
  total_quantity: number;
  mandi_wise: {
    mandi_id: number;
    mandi_name: string;
    quantity: number;
    price_per_unit: number;
  }[];
  order_stats: {
    total: number;
    last_7_days: number;
    last_30_days: number;
    last_6_months: number;
    last_year: number;
  };
}

  // Branch stock information

export interface BranchStock {
  branch_id: number;
  branch_name: string;
  current_stock: number;
  stock_received: number;
  stock_carried_forward: number;
  price_per_unit: number;
  quality: string;
  wastage_level: string;
  last_updated: string;
}

  // Weekly sales trend data

export interface WeeklyTrend {
  week: number;
  sales: number;
}

  // User preference settings
interface UserPreference {
  language: string;
}

export interface WholesalerEarningsQuery {
  from?: string;
  to?: string;
  status?: 'all' | 'pending' | 'ready' | 'credited' | 'held' | 'deducted' | 'cancelled';
}

export interface WholesalerEarningsSummary {
  from_date?: string;
  to_date?: string;
  status: string;
  expected_amount: number;
  deduction_amount: number;
  net_payable_amount: number;
  credited_amount: number;
  pending_amount: number;
  held_amount: number;
  ready_amount: number;
  allocation_count: number;
  order_count: number;
  payout_destination?: string;
  timezone: string;
  generated_at: string;
}

export interface WholesalerEarningsDay {
  date: string;
  order_count: number;
  allocation_count: number;
  credited_count: number;
  expected_amount: number;
  deduction_amount: number;
  net_payable: number;
  credited_amount: number;
  pending_amount: number;
}

export interface WholesalerEarningsOrder {
  allocation_id: number;
  checkout_session_id?: number;
  order_id?: number;
  job_id?: number;
  event_date?: string;
  order_date?: string;
  delivered_at?: string;
  release_after?: string;
  released_at?: string;
  retailer_id?: number;
  retailer_name?: string;
  order_status_id?: number;
  order_status?: string;
  settlement_status: string;
  settlement_status_label: string;
  expected_amount: number;
  fee_amount: number;
  tax_amount: number;
  hold_amount: number;
  deduction_amount: number;
  actual_amount: number;
  credited_amount: number;
  pending_amount: number;
  difference_amount: number;
  payout_reference?: string;
  payout_destination?: string;
  reason_summary?: string;
  hold_reason?: string;
  release_block_reason?: string;
  admin_note?: string;
  delivery_address?: string;
}

export interface WholesalerEarningsOrderItem {
  order_item_id: number;
  product_id?: number;
  product_name?: string;
  branch_id?: number;
  branch_name?: string;
  quantity: number;
  unit_name?: string;
  price_per_unit: number;
  line_amount: number;
}

export interface WholesalerEarningsDeductionReason {
  code: string;
  label: string;
  detail?: string;
  amount: number;
}

export interface WholesalerEarningsOrderDetail {
  order: WholesalerEarningsOrder;
  items: WholesalerEarningsOrderItem[];
  deduction_reasons: WholesalerEarningsDeductionReason[];
}

export interface WholesalerEarningsOrdersResponse {
  items: WholesalerEarningsOrder[];
  page: number;
  page_size: number;
  total: number;
  has_more: boolean;
}

/**
 * Service for handling all wholesaler-related API calls
 * Provides methods for orders, products, inventory, and business operations
 */
@Injectable({
  providedIn: 'root'
})
export class WholesalerApiService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  /**
   * Get authentication headers with JWT token
   * @returns HttpHeaders with authorization token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-App-Language': this.getPreferredLanguage()
    });
  }

  private getPreferredLanguage(): string {
    const rawLang = (
      localStorage.getItem('preferred_language') ||
      localStorage.getItem('appLang') ||
      'en'
    ).toLowerCase();
    const baseLang = rawLang.split('-')[0];
    const supportedLangs = ['en', 'hi', 'te', 'ta', 'kn', 'ml', 'or', 'mr', 'gu', 'bn', 'pa', 'ur'];
    return supportedLangs.includes(baseLang) ? baseLang : 'en';
  }

  /**
   * Exponential backoff retry strategy: 1s, 2s, 4s (max 3 attempts)
   * Applies to GET requests and retryable POST operations
   * Returns a MonoTypeOperatorFunction to preserve type through the operator chain
   */
  private getExponentialBackoffRetry<T>(): MonoTypeOperatorFunction<T> {
    return (source: Observable<T>) =>
      source.pipe(
        retryWhen(errors =>
          errors.pipe(
            concatMap((error, index) => {
              // Do not retry on client errors (4xx) except 429 (rate limit)
              if (error.status >= 400 && error.status < 500 && error.status !== 429) {
                return throwError(() => error);
              }
              // Allow up to 3 retries
              if (index < 3) {
                const delayMs = Math.pow(2, index) * 1000; // 1s, 2s, 4s
                return timer(delayMs);
              }
              return throwError(() => error);
            }),
            finalize(() => {
              // Cleanup any pending operations
            })
          )
        )
      );
  }

  /**
   * Returns true for errors that are safe to surface as network/timeout failures.
   * Used to keep mutation error-handling consistent with read error-handling.
   */
  static isNetworkOrTimeout(err: any): boolean {
    if (!err) return false;
    const msg = (err.message || '').toLowerCase();
    // Wrapped errors from handleError have a message key like 'ERRORS.NETWORK_ERROR'
    if (msg.includes('errors.network_error')) return true;
    // Raw HttpErrorResponse: status 0 = no connection, name TimeoutError
    if (err.originalError?.status === 0) return true;
    if (err.originalError?.name === 'TimeoutError') return true;
    return false;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'ERRORS.UNKNOWN_ERROR';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error - do NOT log the full message
      // Just record that a network error occurred
      errorMessage = 'ERRORS.NETWORK_ERROR';
    } else {
      // Backend returned an unsuccessful response code
      // Do NOT log the full response body - it may contain sensitive data

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
        case 409:
          errorMessage = 'ERRORS.CONFLICT';
          break;
        case 429:
          errorMessage = 'ERRORS.RATE_LIMIT_EXCEEDED';
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

    return throwError(() => ({ message: errorMessage, originalError: error }));
  }

  getOrderSummary(): Observable<OrderSummary[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<OrderSummary[]>(
      `${this.apiUrl}/getOrderSummary`,
      { headers }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getOrderItemDetails(): Observable<OrderItemDetails[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<OrderItemDetails[]>(
      `${this.apiUrl}/getOrderItemDetails`,
      { headers }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getOrderDetails(orderId: number): Observable<OrderDetailedView> {
    const headers = this.getAuthHeaders();
    return this.http.get<OrderDetailedView>(
      `${this.apiUrl}/getOrderDetails/${orderId}`,
      { headers }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getOrderFullDetails(orderId: number): Observable<OrderFullDetails> {
    const headers = this.getAuthHeaders();
    return this.http.get<OrderFullDetails>(
      `${this.apiUrl}/getAllOrderDetails/${orderId}`,
      { headers }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  cancelOrder(orderId: number, reason: string): Observable<CancelOrderResponse> {
    const headers = this.getAuthHeaders();
    // NOTE: No exponential-backoff retry for this mutation.
    // Retrying a cancel POST could attempt a duplicate cancellation on the backend.
    return this.http.post<CancelOrderResponse>(
      `${this.apiUrl}/wholesaler/cancel-order/${orderId}`,
      { cancellation_reason: reason },
      { headers }
    ).pipe(
      timeout(30000),
      // Re-wrap to expose httpStatus alongside the translated message key,
      // so callers can distinguish 401 / 409 / 5xx / network errors.
      catchError((error: HttpErrorResponse) =>
        throwError(() => ({
          message: this.handleErrorMessage(error),
          httpStatus: error.status ?? 0,
          originalError: error,
        }))
      )
    );
  }

  /**
   * Translate an HttpErrorResponse into a message-key string.
   * Extracted from handleError so it can be called without returning Observable<never>.
   */
  private handleErrorMessage(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent || error.status === 0) {
      return 'ERRORS.NETWORK_ERROR';
    }
    switch (error.status) {
      case 400: return 'ERRORS.BAD_REQUEST';
      case 401: return 'ERRORS.UNAUTHORIZED';
      case 403: return 'ERRORS.FORBIDDEN';
      case 404: return 'ERRORS.NOT_FOUND';
      case 409: return 'ERRORS.CONFLICT';
      case 429: return 'ERRORS.RATE_LIMIT_EXCEEDED';
      case 500: return 'ERRORS.SERVER_ERROR';
      case 503: return 'ERRORS.SERVICE_UNAVAILABLE';
      default:  return 'ERRORS.UNKNOWN_ERROR';
    }
  }

  getCompletedOrders(wholesalerId?: number, daysAgo?: number): Observable<OrderItemDetails[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<OrderItemDetails[]>(
      `${this.apiUrl}/getCompletedOrderSummary`,
      { headers }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry<OrderItemDetails[]>(),
      map((orders: OrderItemDetails[]) => {
        if (daysAgo) {
          const filterDate = new Date();
          filterDate.setDate(filterDate.getDate() - daysAgo);
          return orders.filter(order => {
            const orderDate = new Date(order.actual_delivery_date);
            return orderDate >= filterDate;
          });
        }
        return orders;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  getRestockingRecommendations(daysBack: number = 30): Observable<RestockProduct[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<RestockProduct[]>(
      `${this.apiUrl}/getReStockProductsHandler?days_back=${daysBack}`,
      { headers }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getBulkOrders(): Observable<BulkOrder[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<BulkOrder[]>(
      `${this.apiUrl}/getAllBulkOrderDetails`,
      { headers }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getTopRetailers(): Observable<TopRetailer[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<RetailerProductResponse[]>(
      `${this.apiUrl}/getTopRetailerDetails`,
      { headers }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry<RetailerProductResponse[]>(),
      map((response: RetailerProductResponse[]) => this.transformTopRetailers(response)),
      catchError(this.handleError.bind(this))
    );
  }

  private transformTopRetailers(response: RetailerProductResponse[]): TopRetailer[] {
    const retailerMap = new Map<number, TopRetailer>();

    response.forEach(item => {
      if (!retailerMap.has(item.retailer_id)) {
        retailerMap.set(item.retailer_id, {
          retailer_id: item.retailer_id,
          retailer_name: item.retailer_name,
          total_quantity: 0,
          total_order_value: 0,
          products: []
        });
      }

      const retailer = retailerMap.get(item.retailer_id)!;

      retailer.products.push({
        product_id: item.product_id,
        product_name: item.product_name,
        unit_id: item.unit_id,
        quantity: item.quantity,
        order_value: item.order_value
      });

      retailer.total_quantity += item.quantity;
      retailer.total_order_value += item.order_value;
    });

    return Array.from(retailerMap.values());
  }

  createOffer(offer: CreateOfferRequest): Observable<CreateOfferResponse> {
    const headers = this.getAuthHeaders();

    const offerData = {
      ...offer,
      wholeseller_id: offer.wholeseller_id || this.authService.getUserId()
    };

    return this.http.post<CreateOfferResponse>(
      `${this.apiUrl}/InsertWholesellerOffers`,
      offerData,
      { headers }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  createWholesellerEntry(entry: WholesellerEntry): Observable<WholesellerEntryResponse> {
    const headers = this.getAuthHeaders();

    const entryData = {
      ...entry,
      wholeseller_id: entry.wholeseller_id || this.authService.getUserId()
    };

    // Validate required fields
    if (!entryData.wholeseller_id || !entryData.product_id || !entryData.mandi_id) {
      return throwError(() => ({
        message: 'ERRORS.MISSING_REQUIRED_FIELDS',
        originalError: new Error('Missing wholeseller_id, product_id, or mandi_id')
      }));
    }

    return this.http.post<WholesellerEntryResponse>(
      `${this.apiUrl}/InsertWholesellerOrder`,
      entryData,
      { headers }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getProducts(wholesalerId?: number): Observable<{ product_id: number, product_name: string }[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<{ product_id: number, product_name: string }[]>(
      `${this.apiUrl}/getProducts`,
      { headers }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getMandis(): Observable<Mandi[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Mandi[]>(
      `${this.apiUrl}/getAllMandiDetails`,
      { headers }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  addMandi(mandi: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(
      `${this.apiUrl}/InsertMandiDetailsForWholeseller`,
      mandi,
      { headers }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getWarehouses(wholesalerId?: number): Observable<{ warehouse_id: number, warehouse_name: string }[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<{ warehouse_id: number, warehouse_name: string }[]>(
      `${this.apiUrl}/getWarehouses`,
      { headers }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getUnits(): Observable<{ unit_id: number, unit_name: string }[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ unit_id: number, unit_name: string }[]>(
      `${this.apiUrl}/getUnits`,
      { headers }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getBusinessExistsOrNot(): Observable<boolean> {
    const headers = this.getAuthHeaders();
    return this.http.get<boolean>(
      `${this.apiUrl}/getBusinessExistsOrNot`,
      { headers }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getLanguages(): Observable<Language[]> {
    return this.http.get<Language[]>(
      `${this.apiUrl}/getAllLanguages`
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getUserPreference(): Observable<UserPreference> {
    return this.http.get<UserPreference>(
      `${this.apiUrl}/getUserLanguagePreference`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  setLanguagePreference(langId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/setUserLanguagePreference`,
      { lang_id: langId },
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getWholesalerProducts(
    page?: number,
    limit?: number,
    search?: string
  ): Observable<WholesalerProduct[]> {
    const headers = this.getAuthHeaders();
    const params: any = {};

    if (page !== undefined) {
      params.page = page;
    }
    if (limit !== undefined) {
      params.limit = limit;
    }
    if (search) {
      params.search = search;
    }

    return this.http.get<WholesalerProduct[]>(
      `${this.apiUrl}/wholesaler/products`,
      { headers, params }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getWholesalerProductsWithDemand(
    page?: number,
    limit?: number,
    search?: string
  ): Observable<WholesalerProductWithDemand[]> {
    const headers = this.getAuthHeaders();
    const params: any = {};

    if (page !== undefined) {
      params.page = page;
    }
    if (limit !== undefined) {
      params.limit = limit;
    }
    if (search) {
      params.search = search;
    }

    return this.http.get<WholesalerProductWithDemand[]>(
      `${this.apiUrl}/wholesaler/products-with-demand`,
      { headers, params }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getWholesalerDashboardSummary(): Observable<WholesalerDashboardSummary> {
    const headers = this.getAuthHeaders();
    return this.http.get<WholesalerDashboardSummary>(
      `${this.apiUrl}/wholesaler/dashboard-summary`,
      { headers }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getWholesalerNextDayDemand(
    page?: number,
    limit?: number
  ): Observable<WholesalerDemandProduct[]> {
    const headers = this.getAuthHeaders();
    const params: any = {};

    if (page !== undefined) {
      params.page = page;
    }
    if (limit !== undefined) {
      params.limit = limit;
    }

    return this.http.get<WholesalerDemandProduct[]>(
      `${this.apiUrl}/wholesaler/next-day-demand`,
      { headers, params }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getWholesalerPastDemand(
    page?: number,
    limit?: number
  ): Observable<WholesalerPastDemandProduct[]> {
    const headers = this.getAuthHeaders();
    const params: any = {};

    if (page !== undefined) {
      params.page = page;
    }
    if (limit !== undefined) {
      params.limit = limit;
    }

    return this.http.get<WholesalerPastDemandProduct[]>(
      `${this.apiUrl}/wholesaler/past-demand`,
      { headers, params }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getWholesalerProductDetails(
    productId: number
  ): Observable<WholesalerProductDetails> {
    const headers = this.getAuthHeaders();

    return this.http.get<WholesalerProductDetails>(
      `${this.apiUrl}/wholesaler/products/${productId}`,
      { headers }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  updateProductStockForMandi(
    productId: number,
    mandiId: number,
    newQuantity: number
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/wholesaler/product/update-stock-mandi`,
      {
        product_id: productId,
        mandi_id: mandiId,
        new_quantity: newQuantity
      },
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  updateProductPriceForMandi(
    productId: number,
    mandiId: number,
    newPrice: number
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/wholesaler/product/update-price-mandi`,
      {
        product_id: productId,
        mandi_id: mandiId,
        new_price: newPrice
      },
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getWholesalerEarningsSummary(query: WholesalerEarningsQuery = {}): Observable<WholesalerEarningsSummary> {
    return this.http.get<WholesalerEarningsSummary>(
      `${this.apiUrl}/wholesaler/earnings/summary`,
      { headers: this.getAuthHeaders(), params: this.buildEarningsParams(query) }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getWholesalerEarningsDays(query: WholesalerEarningsQuery = {}): Observable<WholesalerEarningsDay[]> {
    return this.http.get<WholesalerEarningsDay[]>(
      `${this.apiUrl}/wholesaler/earnings/days`,
      { headers: this.getAuthHeaders(), params: this.buildEarningsParams(query) }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getWholesalerEarningsOrders(
    query: WholesalerEarningsQuery & { date?: string; page?: number; page_size?: number } = {}
  ): Observable<WholesalerEarningsOrdersResponse> {
    return this.http.get<WholesalerEarningsOrdersResponse>(
      `${this.apiUrl}/wholesaler/earnings/orders`,
      { headers: this.getAuthHeaders(), params: this.buildEarningsParams(query) }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  getWholesalerEarningsOrderDetail(orderId: number): Observable<WholesalerEarningsOrderDetail> {
    return this.http.get<WholesalerEarningsOrderDetail>(
      `${this.apiUrl}/wholesaler/earnings/orders/${orderId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(30000),
      this.getExponentialBackoffRetry(),
      catchError(this.handleError.bind(this))
    );
  }

  private buildEarningsParams(query: WholesalerEarningsQuery & Record<string, any>): Record<string, string> {
    const params: Record<string, string> = {};
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = String(value);
      }
    });
    return params;
  }
}