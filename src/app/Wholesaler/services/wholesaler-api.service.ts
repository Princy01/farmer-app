import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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

interface OrderItemDetails {
  order_id: number;
  total_order_amount: number;
  order_items: OrderItem[];
  created_at?: string;
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

//for for-sale screen
interface CreateOrderRequest {
  retailer_id: number;
  retailer_contact: string;
  pincode: string;
  address: string;
  max_price_limit: number;
  desired_delivery_date: string;
  delivery_deadline: string;
  product_ids: number[];
  quantities: number[];
  unit_ids: number[];
  max_item_prices: number[];
  wholeseller_ids: number[];
}

interface CreateOrderResponse {
  order_id: number;
  status: string;
  message: string;
}

interface OrderFullDetails {
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

@Injectable({
  providedIn: 'root'
})
export class WholesalerApiService {
  private readonly API_URL = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  getOrderSummary(): Observable<OrderSummary[]> {
    return this.http.get<OrderSummary[]>(`${this.API_URL}/getOrderSummary`);
  }

  getOrderItemDetails(): Observable<OrderItemDetails[]> {
    return this.http.get<OrderItemDetails[]>(`${this.API_URL}/getOrderItemDetails`);
  }

  getOrderDetails(orderId: number): Observable<OrderDetailedView> {
    return this.http.get<OrderDetailedView>(`${this.API_URL}/getOrderDetails/${orderId}`);
  }

  createOrder(orderData: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(
      `${this.API_URL}/InsertOrderByRetailer`,
      orderData
    );
  }

  getOrderFullDetails(orderId: number): Observable<OrderFullDetails> {
    return this.http.get<OrderFullDetails>(
      `${this.API_URL}/getAllOrderDetails/${orderId}`
    );
  }

  getCompletedOrders(daysAgo?: number): Observable<OrderItemDetails[]> {
    return this.http.get<OrderItemDetails[]>(
      `${this.API_URL}/getCompletedOrderSummary`
    ).pipe(
      map(orders => {
        if (daysAgo) {
          const filterDate = new Date();
          filterDate.setDate(filterDate.getDate() - daysAgo);
          return orders.filter(order => {
            // Assuming each order has a created_at or date field
            const orderDate = new Date(order.created_at || '');
            return orderDate >= filterDate;
          });
        }
        return orders;
      })
    );
  }
}