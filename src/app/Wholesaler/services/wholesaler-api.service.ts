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
  actual_delivery_date: string;
  retailer_id: number;
  shop_name: string;
  wholeseller_ids: number[];
  total_order_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  products: {
    product_id: number;
    product_name: string;
    category_id: number;
    category_name: string;
    quantity: number;
    unit_id: number;
    unit_name: string;
    max_price: number;
  }[];
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
  stock_to_sales_ratio: number;
  stock_status: string;
  mandi: MandiStock[];
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

  getRestockingRecommendations(wholesalerId?: number): Observable<RestockProduct[]> {
    const headers = this.getAuthHeaders();

    // Always use JWT - wholesalerId parameter kept for backward compatibility but not used
    return this.http.get<RestockProduct[]>(
      `${this.apiUrl}/getReStockProductsHandler`,
      { headers }
    );
  }

  getBulkOrders(wholesalerId?: number): Observable<BulkOrder[]> {
    const headers = this.getAuthHeaders();

    // Always use JWT - wholesalerId parameter kept for backward compatibility but not used
    return this.http.get<BulkOrder[]>(
      `${this.apiUrl}/getAllBulkOrderDetails`,
      { headers }
    );
  }

  getTopRetailers(wholesalerId?: number): Observable<TopRetailer[]> {
    const headers = this.getAuthHeaders();

    // Always use JWT - wholesalerId parameter kept for backward compatibility but not used
    return this.http.get<TopRetailer[]>(
      `${this.apiUrl}/getTopRetailerDetails`,
      { headers }
    );
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

  getMandis(wholesalerId?: number): Observable<{ mandi_id: number, mandi_name: string }[]> {
    const headers = this.getAuthHeaders();

    // Always use JWT - wholesalerId parameter kept for backward compatibility but not used
    return this.http.get<{ mandi_id: number, mandi_name: string }[]>(
      `${this.apiUrl}/getMandis`,
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
}