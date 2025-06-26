import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

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

  constructor(private http: HttpClient) { }

  getOrderSummary(): Observable<OrderSummary[]> {
    return this.http.get<OrderSummary[]>(`${this.apiUrl}/getOrderSummary`);
  }

  getOrderItemDetails(): Observable<OrderItemDetails[]> {
    return this.http.get<OrderItemDetails[]>(`${this.apiUrl}/getOrderItemDetails`);
  }

  getOrderDetails(orderId: number): Observable<OrderDetailedView> {
    return this.http.get<OrderDetailedView>(`${this.apiUrl}/getOrderDetails/${orderId}`);
  }

  getOrderFullDetails(orderId: number): Observable<OrderFullDetails> {
    return this.http.get<OrderFullDetails>(
      `${this.apiUrl}/getAllOrderDetails/${orderId}`
    );
  }

  getCompletedOrders(daysAgo?: number): Observable<OrderItemDetails[]> {
    return this.http.get<OrderItemDetails[]>(
      `${this.apiUrl}/getCompletedOrderSummary`
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

  getRestockingRecommendations(): Observable<RestockProduct[]> {
    return this.http.get<RestockProduct[]>(
      `${this.apiUrl}/getReStockProductsHandler`
    );
  }

  getBulkOrders(): Observable<BulkOrder[]> {
    return this.http.get<BulkOrder[]>(`${this.apiUrl}/getAllBulkOrderDetails`);
  }

  getTopRetailers(): Observable<TopRetailer[]> {
    return this.http.get<TopRetailer[]>(`${this.apiUrl}/getTopRetailerDetails`);
  }


  createOffer(offer: CreateOfferRequest): Observable<CreateOfferResponse> {
    return this.http.post<CreateOfferResponse>(
      `${this.apiUrl}/InsertWholesellerOffers`,
      offer
    );
  }

  createWholesellerEntry(entry: WholesellerEntry): Observable<WholesellerEntryResponse> {
    return this.http.post<WholesellerEntryResponse>(
      `${this.apiUrl}/InsertWholesellerOrder`,
      entry
    );
  }

}