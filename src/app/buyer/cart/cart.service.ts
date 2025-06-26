import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, catchError } from 'rxjs';
import { environment } from 'src/environments/environment';

interface CartProduct {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_id: number;
  unit_name: string;
  price_while_added: number;
  latest_wholesaler_price: number;
  price_updated_at?: string;
  is_active: boolean;
}

interface CartDetails {
  cart_id: number;
  retailer_id: number;
  retailer_name?: string;
  retailer_address?: string;
  retailer_state_name?: string;
  retailer_state_shortname?: string;
  retailer_location_name?: string;
  wholeseller_id?: number;
  wholeseller_name?: string;
  cart_status: number;
}

interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export interface CartResponse {
  cart_details: CartDetails;
  products: CartProduct[];
}

interface CreateCartRequest {
  retailer_id: number;
  wholeseller_id?: number;
  products: Array<{
    product_id: number;
    quantity: number;
    unit_id: number;
    price_while_added: number;
    latest_wholesaler_price: number;
    is_active: boolean;
  }>;
  device_info?: any;
  cart_status?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = environment.apiUrl;
  private cartSubject = new BehaviorSubject<CartResponse | null>(null);
  cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {}

  getCart(cartId: number): Observable<CartResponse> {
    return this.http.get<ApiResponse<CartResponse>>(`${this.apiUrl}/getCartitems/${cartId}`).pipe(
      map(response => {
        if (response.status === 'error') {
          throw new Error(response.message);
        }
        this.cartSubject.next(response.data!);
        return response.data!;
      }),
      catchError(error => {
        console.error('Error fetching cart:', error);
        throw error;
      })
    );
  }

  createCart(cartData: CreateCartRequest): Observable<CartResponse> {
    return this.http.post<ApiResponse<CartResponse>>(`${this.apiUrl}/InsertCartDetails`, cartData).pipe(
      map(response => {
        if (response.status === 'error') {
          throw new Error(response.message);
        }
        this.cartSubject.next(response.data!);
        return response.data!;
      }),
      catchError(error => {
        console.error('Error creating cart:', error);
        throw error;
      })
    );
  }

  removeCartItem(cartId: number, productId: number, wholesellerId?: number): Observable<CartResponse> {
    const url = wholesellerId ?
      `${this.apiUrl}/cart/${cartId}/item/${productId}?wholeseller_id=${wholesellerId}` :
      `${this.apiUrl}/cart/${cartId}/item/${productId}`;

    return this.http.delete<ApiResponse<CartResponse>>(url).pipe(
      map(response => {
        if (response.status === 'error') {
          throw new Error(response.message);
        }
        this.cartSubject.next(response.data!);
        return response.data!;
      }),
      catchError(error => {
        console.error('Error removing cart item:', error);
        throw error;
      })
    );
  }

  // Helper method to get current cart value
  getCurrentCart(): CartResponse | null {
    return this.cartSubject.value;
  }
}