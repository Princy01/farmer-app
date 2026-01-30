import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, retry } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

/**
 * Error response from API
 */
export interface ApiErrorResponse {
  error?: {
    message?: string;
    code?: string;
  };
  message?: string;
  statusCode?: number;
}

/**
 * Order summary for home screen
 */
interface OrderSummary {
  wholeseller_id: number;
  mandi_id: number;
  product_id: number;
  product_name: string;
  stock_left: number;
  stock_in: number;
}

/**
 * Order item for My Orders screen
 */
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
}

/**
 * Detailed order view for Order Details screen
 */
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

/**
 * Response from create order API
 */
interface CreateOrderResponse {
  order_id: number;
  status: string;
  message: string;
}

export interface OrderFullDetails {
  order_id: number;
  date_of_order: string;
  order_status: number;
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

/**
 * Mandi stock information
 */
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

/**
 * Bulk order item for market opportunities screen
 */
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

/**
 * Response interface for retailer products (flat structure from API)
 */
export interface RetailerProductResponse {
  retailer_id: number;
  retailer_name: string;
  product_id: number;
  product_name: string;
  unit_id: number;
  quantity: number;
  order_value: number;
}

/**
 * Product information for a retailer
 */
export interface RetailerProduct {
  product_id: number;
  product_name: string;
  unit_id: number;
  quantity: number;
  order_value: number;
}

/**
 * Top retailer with aggregated product information
 */
export interface TopRetailer {
  retailer_id: number;
  retailer_name: string;
  total_quantity: number;
  total_order_value: number;
  products: RetailerProduct[];
}

/**
 * Request payload for creating an offer
 */
export interface CreateOfferRequest {
  order_id: number;
  wholeseller_id: number;
  offered_price: number;
  proposed_delivery_date: string;
  message?: string;
}

/**
 * Response from create offer API
 */
export interface CreateOfferResponse {
  offer_id: number;
}

/**
 * Wholesaler entry for sale screen
 */
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

/**
 * Response from wholesaler entry creation
 */
export interface WholesellerEntryResponse {
  message: string;
  entry_id: number;
}

/**
 * Mandi (market) information
 */
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

/**
 * Language information
 */
interface Language {
  id: number;
  code: string;
  name: string;
}

/**
 * Wholesaler product summary
 */
export interface WholesalerProduct {
  product_id: number;
  product_name: string;
  total_stock: number;
  total_orders: number;
}

/**
 * Detailed wholesaler product information
 */
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

/**
 * Branch stock information
 */
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

/**
 * Weekly sales trend data
 */
export interface WeeklyTrend {
  week: number;
  sales: number;
}

/**
 * User preference settings
 */
interface UserPreference {
  language: string;
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
      'Content-Type': 'application/json'
    });
  }

  /**
   * Handle HTTP errors and return user-friendly error messages
   * @param error - The HTTP error response
   * @returns Observable that throws formatted error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'ERRORS.UNKNOWN_ERROR';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      console.error('Client-side error:', error.error.message);
      errorMessage = 'ERRORS.NETWORK_ERROR';
    } else {
      // Backend returned an unsuccessful response code
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${JSON.stringify(error.error)}`
      );

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
          errorMessage = error.error?.message || 'ERRORS.UNKNOWN_ERROR';
      }
    }

    return throwError(() => ({ message: errorMessage, originalError: error }));
  }

  /**
   * Get order summary for the authenticated wholesaler
   * @returns Observable of order summaries
   */
  getOrderSummary(): Observable<OrderSummary[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<OrderSummary[]>(
      `${this.apiUrl}/getOrderSummary`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get detailed information for all order items
   * @returns Observable of order item details
   */
  getOrderItemDetails(): Observable<OrderItemDetails[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<OrderItemDetails[]>(
      `${this.apiUrl}/getOrderItemDetails`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get detailed view of a specific order
   * @param orderId - The ID of the order to retrieve
   * @returns Observable of detailed order view
   */
  getOrderDetails(orderId: number): Observable<OrderDetailedView> {
    const headers = this.getAuthHeaders();
    return this.http.get<OrderDetailedView>(
      `${this.apiUrl}/getOrderDetails/${orderId}`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get complete details of a specific order including all products
   * @param orderId - The ID of the order to retrieve
   * @returns Observable of full order details
   */
  getOrderFullDetails(orderId: number): Observable<OrderFullDetails> {
    const headers = this.getAuthHeaders();
    return this.http.get<OrderFullDetails>(
      `${this.apiUrl}/getAllOrderDetails/${orderId}`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get completed orders for the authenticated wholesaler
   * @param wholesalerId - (Deprecated) Wholesaler ID - kept for backward compatibility, uses JWT instead
   * @param daysAgo - Optional filter to get orders from the last N days
   * @returns Observable of completed order details
   */
  getCompletedOrders(wholesalerId?: number, daysAgo?: number): Observable<OrderItemDetails[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<OrderItemDetails[]>(
      `${this.apiUrl}/getCompletedOrderSummary`,
      { headers }
    ).pipe(
      retry(1),
      map(orders => {
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

  /**
   * Get restocking recommendations based on sales data
   * @param daysBack - Number of days to look back for analysis (default: 30)
   * @returns Observable of products needing restocking
   */
  getRestockingRecommendations(daysBack: number = 30): Observable<RestockProduct[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<RestockProduct[]>(
      `${this.apiUrl}/getReStockProductsHandler?days_back=${daysBack}`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get all bulk orders for market opportunities
   * @returns Observable of bulk orders
   */
  getBulkOrders(): Observable<BulkOrder[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<BulkOrder[]>(
      `${this.apiUrl}/getAllBulkOrderDetails`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get top retailers with their product orders and aggregated totals
   * @returns Observable of top retailers with product details
   */
  getTopRetailers(): Observable<TopRetailer[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<RetailerProductResponse[]>(
      `${this.apiUrl}/getTopRetailerDetails`,
      { headers }
    ).pipe(
      retry(1),
      map(response => this.transformTopRetailers(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Transform flat retailer-product response into grouped TopRetailer structure
   * Groups products by retailer and calculates aggregated totals
   * @param response - Flat array of retailer-product data from API
   * @returns Array of retailers with grouped product information
   */
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

  /**
   * Create a new offer for a bulk order
   * @param offer - The offer details to submit
   * @returns Observable of created offer response with offer ID
   */
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
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Create a new wholesaler entry for sale
   * @param entry - The entry details including product, quantity, price, etc.
   * @returns Observable of entry creation response
   * @throws Error if required fields are missing
   */
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
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get all products available for the wholesaler
   * @param wholesalerId - (Deprecated) Wholesaler ID - kept for backward compatibility, uses JWT instead
   * @returns Observable of products with ID and name
   */
  getProducts(wholesalerId?: number): Observable<{ product_id: number, product_name: string }[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<{ product_id: number, product_name: string }[]>(
      `${this.apiUrl}/getProducts`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get all mandis (markets) associated with the wholesaler
   * @returns Observable of mandi details
   */
  getMandis(): Observable<Mandi[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Mandi[]>(
      `${this.apiUrl}/getAllMandiDetails`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Add a new mandi (market) for the wholesaler
   * @param mandi - The mandi details to create
   * @returns Observable of creation response
   */
  addMandi(mandi: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(
      `${this.apiUrl}/InsertMandiDetailsForWholeseller`,
      mandi,
      { headers }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get all warehouses for the authenticated wholesaler
   * @param wholesalerId - (Deprecated) Wholesaler ID - kept for backward compatibility, uses JWT instead
   * @returns Observable of warehouses with ID and name
   */
  getWarehouses(wholesalerId?: number): Observable<{ warehouse_id: number, warehouse_name: string }[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<{ warehouse_id: number, warehouse_name: string }[]>(
      `${this.apiUrl}/getWarehouses`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get all available units of measurement
   * @returns Observable of units with ID and name
   */
  getUnits(): Observable<{ unit_id: number, unit_name: string }[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ unit_id: number, unit_name: string }[]>(
      `${this.apiUrl}/getUnits`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Check if the wholesaler has a registered business
   * @returns Observable of boolean indicating business existence
   */
  getBusinessExistsOrNot(): Observable<boolean> {
    const headers = this.getAuthHeaders();
    return this.http.get<boolean>(
      `${this.apiUrl}/getBusinessExistsOrNot`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get all available languages for the application
   * @returns Observable of available languages
   */
  getLanguages(): Observable<Language[]> {
    return this.http.get<Language[]>(
      `${this.apiUrl}/getAllLanguages`
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get user's language preference
   * @returns Observable of user preferences including language
   */
  getUserPreference(): Observable<UserPreference> {
    return this.http.get<UserPreference>(
      `${this.apiUrl}/getUserLanguagePreference`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Set user's language preference
   * @param langId - The language ID to set as preference
   * @returns Observable of update response
   */
  setLanguagePreference(langId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/setUserLanguagePreference`,
      { lang_id: langId },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get paginated list of wholesaler products with optional search
   * @param page - Page number for pagination
   * @param limit - Number of items per page
   * @param search - Optional search query to filter products
   * @returns Observable of wholesaler products
   */
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
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get detailed information for a specific wholesaler product
   * @param productId - The ID of the product to retrieve details for
   * @returns Observable of detailed product information including mandi-wise data and order stats
   */
  getWholesalerProductDetails(
    productId: number
  ): Observable<WholesalerProductDetails> {
    const headers = this.getAuthHeaders();

    return this.http.get<WholesalerProductDetails>(
      `${this.apiUrl}/wholesaler/products/${productId}`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Update product stock quantity for a specific mandi
   * @param productId - The ID of the product to update
   * @param mandiId - The ID of the mandi where stock is being updated
   * @param newQuantity - The new stock quantity
   * @returns Observable of update response
   */
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
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Update product price for a specific mandi
   * @param productId - The ID of the product to update
   * @param mandiId - The ID of the mandi where price is being updated
   * @param newPrice - The new price per unit
   * @returns Observable of update response
   */
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
      catchError(this.handleError.bind(this))
    );
  }
}