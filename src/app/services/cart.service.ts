import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private baseUrl = 'http://127.0.0.1:3000/cart';
  private cartItemsSubject = new BehaviorSubject<any[]>([]); // Observable for cart updates
  cartItems$ = this.cartItemsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCart(); // Load cart items on service initialization
  }

  // Load Cart from Backend
  private loadCart() {
    this.http.get<any[]>(`${this.baseUrl}`).subscribe(items => {
      this.cartItemsSubject.next(items);
    });
  }

  // Get Cart Items
  getCartItems(): Observable<any[]> {
    return this.cartItems$;
  }

  // Add Item to Cart
  addToCart(product: any): void {
    this.http.post(`${this.baseUrl}/add`, product).subscribe(() => {
      this.loadCart();
    });
  }

  // Update Item Quantity
  updateQuantity(productId: string, quantity: number): void {
    this.http.put(`${this.baseUrl}/update`, { productId, quantity }).subscribe(() => {
      this.loadCart();
    });
  }

  // Remove Item from Cart
  removeFromCart(productId: string): void {
    this.http.delete(`${this.baseUrl}/remove/${productId}`).subscribe(() => {
      this.loadCart();
    });
  }

  // Apply Discount Code
  applyDiscount(code: string): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/apply-discount`, { code });
  }

  // Checkout
  checkout(orderData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/checkout`, orderData);
  }
}
