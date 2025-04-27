import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

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

interface CartResponse {
  cart_details: CartDetails;
  products: CartProduct[];
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private baseUrl = 'http://127.0.0.1:3000';
  private cartSubject = new BehaviorSubject<CartResponse | null>(null);
  cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {}

  getCart(cartId: number): Observable<CartResponse> {
    return this.http.get<CartResponse>(`${this.baseUrl}/getCartitems/${cartId}`);
  }

  createCart(cartData: {
    retailer_id: number;
    wholeseller_id?: number;
    products: Array<{
      product_id: number;
      quantity: number;
      unit_id: number;
      price_while_added: number;
      latest_wholesaler_price: number;
      price_updated_at?: string;
      wholeseller_id: number;
      is_active: boolean;
    }>;
    device_info?: any;
    cart_status?: number;
  }): Observable<CartResponse> {
    return this.http.post<CartResponse>(`${this.baseUrl}/InsertCartDetails`, cartData);
  }

  removeCartItem(cartId: number, productId: number, wholesellerId?: number): Observable<CartResponse> {
    const url = wholesellerId ?
      `${this.baseUrl}/${cartId}/items/${productId}?wholeseller_id=${wholesellerId}` :
      `${this.baseUrl}/${cartId}/items/${productId}`;
    return this.http.delete<CartResponse>(url);
  }
}

// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable, BehaviorSubject } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class CartService {
//   private baseUrl = 'http://127.0.0.1:3000/cart';
//   private cartItemsSubject = new BehaviorSubject<any[]>([]); // Observable for cart updates
//   cartItems$ = this.cartItemsSubject.asObservable();

//   constructor(private http: HttpClient) {
//     this.loadCart(); // Load cart items on service initialization
//   }

//   // Load Cart from Backend
//   private loadCart() {
//     this.http.get<any[]>(`${this.baseUrl}`).subscribe(items => {
//       this.cartItemsSubject.next(items);
//     });
//   }

//   // Get Cart Items
//   getCartItems(): Observable<any[]> {
//     return this.cartItems$;
//   }

//   // Add Item to Cart
//   addToCart(product: any): void {
//     this.http.post(`${this.baseUrl}/add`, product).subscribe(() => {
//       this.loadCart();
//     });
//   }

//   // Update Item Quantity
//   updateQuantity(productId: string, quantity: number): void {
//     this.http.put(`${this.baseUrl}/update`, { productId, quantity }).subscribe(() => {
//       this.loadCart();
//     });
//   }

//   // Remove Item from Cart
//   removeFromCart(productId: string): void {
//     this.http.delete(`${this.baseUrl}/remove/${productId}`).subscribe(() => {
//       this.loadCart();
//     });
//   }

//   // Apply Discount Code
//   applyDiscount(code: string): Observable<number> {
//     return this.http.post<number>(`${this.baseUrl}/apply-discount`, { code });
//   }

//   // Checkout
//   checkout(orderData: any): Observable<any> {
//     return this.http.post(`${this.baseUrl}/checkout`, orderData);
//   }
// }
