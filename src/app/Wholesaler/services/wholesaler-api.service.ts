import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

//for home screen
interface OrderSummary {
  wholeseller_id: number;
  mandi_id: number;
  product_id: number;
  product_name: string;
  stock_left: number;
  stock_in: number;
}

//for My Orders screen
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

//for Order Details screen
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
}
//for restocking recommendations screen
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



//for market opportunities screen
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

export interface RetailerProductResponse {
  retailer_id: number;
  retailer_name: string;
  product_id: number;
  product_name: string;
  unit_id: number;
  quantity: number;
  order_value: number;
}

export interface RetailerProduct {
  product_id: number;
  product_name: string;
  unit_id: number;
  quantity: number;
  order_value: number;
}

export interface TopRetailer {
  retailer_id: number;
  retailer_name: string;
  total_quantity: number;
  total_order_value: number;
  products: RetailerProduct[];
}

export interface CreateOfferRequest {
  order_id: number;
  wholeseller_id: number;
  offered_price: number;
  proposed_delivery_date: string;
  message?: string;
}

export interface CreateOfferResponse {
  offer_id: number;
}

//for-sale screen
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

export interface WholesellerEntryResponse {
  message: string;
  entry_id: number;
}

// For business locations (mandis)
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

// Language-related interfaces
interface Language {
  id: number;
  code: string;
  name: string;
}

export interface WholesalerProduct {
  product_id: number;
  product_name: string;
  total_stock: number;
  total_orders: number;
}

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

export interface WeeklyTrend {
  week: number;
  sales: number;
}

interface UserPreference {
  language: string;
}

@Injectable({
  providedIn: 'root'
})
export class WholesalerApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService
  ) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getOrderSummary(): Observable<OrderSummary[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<OrderSummary[]>(
      `${this.apiUrl}/getOrderSummary`,
      { headers }
    );
  }

  getOrderItemDetails(): Observable<OrderItemDetails[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<OrderItemDetails[]>(
      `${this.apiUrl}/getOrderItemDetails`,
      { headers }
    );
  }

  getOrderDetails(orderId: number): Observable<OrderDetailedView> {
    const headers = this.getAuthHeaders();
    return this.http.get<OrderDetailedView>(
      `${this.apiUrl}/getOrderDetails/${orderId}`,
      { headers }
    );
  }

  getOrderFullDetails(orderId: number): Observable<OrderFullDetails> {
    const headers = this.getAuthHeaders();
    return this.http.get<OrderFullDetails>(
      `${this.apiUrl}/getAllOrderDetails/${orderId}`,
      { headers }
    );
  }

  getCompletedOrders(wholesalerId?: number, daysAgo?: number): Observable<OrderItemDetails[]> {
    const headers = this.getAuthHeaders();

    // Always use JWT - wholesalerId parameter kept for backward compatibility but not used
    return this.http.get<OrderItemDetails[]>(
      `${this.apiUrl}/getCompletedOrderSummary`,
      { headers }
    ).pipe(
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
      })
    );
  }

  getRestockingRecommendations(daysBack: number = 30): Observable<RestockProduct[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<RestockProduct[]>(
      `${this.apiUrl}/getReStockProductsHandler?days_back=${daysBack}`,
      { headers }
    );
  }

  getBulkOrders(): Observable<BulkOrder[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<BulkOrder[]>(
      `${this.apiUrl}/getAllBulkOrderDetails`,
      { headers }
    );
  }

  getTopRetailers(): Observable<TopRetailer[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<RetailerProductResponse[]>(
      `${this.apiUrl}/getTopRetailerDetails`,
      { headers }
    ).pipe(
      map(response => this.transformTopRetailers(response))
    );
  }

  /**
   * Transform flat retailer-product response into grouped TopRetailer structure
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
    );
  }

  createWholesellerEntry(entry: WholesellerEntry): Observable<WholesellerEntryResponse> {
    const headers = this.getAuthHeaders();

    const entryData = {
      ...entry,
      wholeseller_id: entry.wholeseller_id || this.authService.getUserId()
    };

    // Validate that entry has required fields
    if (!entryData.wholeseller_id || !entryData.product_id || !entryData.mandi_id) {
      throw new Error('Missing required fields for wholesaler entry');
    }

    return this.http.post<WholesellerEntryResponse>(
      `${this.apiUrl}/InsertWholesellerOrder`,
      entryData,
      { headers }
    );
  }

  getProducts(wholesalerId?: number): Observable<{ product_id: number, product_name: string }[]> {
    const headers = this.getAuthHeaders();

    // Always use JWT - wholesalerId parameter kept for backward compatibility but not used
    return this.http.get<{ product_id: number, product_name: string }[]>(
      `${this.apiUrl}/getProducts`,
      { headers }
    );
  }

  getMandis(): Observable<Mandi[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Mandi[]>(
      `${this.apiUrl}/getAllMandiDetails`,
      { headers }
    );
  }

  addMandi(mandi: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(
      `${this.apiUrl}/InsertMandiDetailsForWholeseller`,
      mandi,
      { headers }
    );
  }

  getWarehouses(wholesalerId?: number): Observable<{ warehouse_id: number, warehouse_name: string }[]> {
    const headers = this.getAuthHeaders();

    // Always use JWT - wholesalerId parameter kept for backward compatibility but not used
    return this.http.get<{ warehouse_id: number, warehouse_name: string }[]>(
      `${this.apiUrl}/getWarehouses`,
      { headers }
    );
  }

  getUnits(): Observable<{ unit_id: number, unit_name: string }[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ unit_id: number, unit_name: string }[]>(
      `${this.apiUrl}/getUnits`,
      { headers }
    );
  }

  getBusinessExistsOrNot(): Observable<boolean> {
    const headers = this.getAuthHeaders();
    return this.http.get<boolean>(
      `${this.apiUrl}/getBusinessExistsOrNot`,
      { headers }
    );
  }

  getLanguages(): Observable<Language[]> {
    return this.http.get<Language[]>(`${this.apiUrl}/getAllLanguages`);
  }

  getUserPreference(): Observable<UserPreference> {
    return this.http.get<UserPreference>(`${this.apiUrl}/getUserLanguagePreference`, { headers: this.getAuthHeaders() });
  }

  setLanguagePreference(langId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/setUserLanguagePreference`, { lang_id: langId }, { headers: this.getAuthHeaders() });
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
    );
  }

  getWholesalerProductDetails(
    productId: number
  ): Observable<WholesalerProductDetails> {
    const headers = this.getAuthHeaders();

    return this.http.get<WholesalerProductDetails>(
      `${this.apiUrl}/wholesaler/products/${productId}`,
      { headers }
    );
  }

  updateProductStockForMandi(
    productId: number,
    mandiId: number,
    newQuantity: number
  ) {
    return this.http.post(
      `${this.apiUrl}/wholesaler/product/update-stock-mandi`,
      {
        product_id: productId,
        mandi_id: mandiId,
        new_quantity: newQuantity
      },
      { headers: this.getAuthHeaders() }
    );
  }

  updateProductPriceForMandi(
    productId: number,
    mandiId: number,
    newPrice: number
  ) {
    return this.http.post(
      `${this.apiUrl}/wholesaler/product/update-price-mandi`,
      {
        product_id: productId,
        mandi_id: mandiId,
        new_price: newPrice
      },
      { headers: this.getAuthHeaders() }
    );
  }
}