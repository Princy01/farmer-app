import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

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

export interface CreateCartRequest {
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
}

export interface UpdateCartRequest {
  cart_id: number;
  products: Array<{
    product_id: number;
    product_name: string;
    quantity: number;
    unit_id: number;
    unit_name: string;
    price_while_added: number;
    latest_wholesaler_price: number;
    price_updated_at?: string;
    is_active: boolean;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = environment.apiUrl;
  private cartSubject = new BehaviorSubject<CartResponse | null>(null);
  cart$ = this.cartSubject.asObservable();

  // Track pending operations to prevent concurrent requests
  private pendingOperations = new Set<string>();

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private createOperationKey(operation: string, cartId: number, productId?: number): string {
    return `${operation}-${cartId}-${productId || 'all'}`;
  }

  getCart(): Observable<CartResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<ApiResponse<CartResponse>>(`${this.apiUrl}/getCartitems/1`, { headers }).pipe(
      map((response: ApiResponse<CartResponse>) => {
        if (response.status === 'error') {
          throw new Error(response.message);
        }
        console.log('Cart fetched successfully:', response.data);
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
    const headers = this.getAuthHeaders();
    return this.http.post<ApiResponse<CartResponse>>(`${this.apiUrl}/InsertCartDetails`, cartData, { headers }).pipe(
      map((response: ApiResponse<CartResponse>) => {
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

  updateCart(updateData: UpdateCartRequest): Observable<CartResponse> {
    const operationKey = this.createOperationKey('update', updateData.cart_id);

    // Prevent concurrent operations
    if (this.pendingOperations.has(operationKey)) {
      console.log('Update already in progress, skipping...');
      return throwError(() => new Error('Update already in progress'));
    }

    this.pendingOperations.add(operationKey);
    const headers = this.getAuthHeaders();

    // Ensure clean data structure
    const requestPayload = {
      cart_id: updateData.cart_id,
      products: updateData.products.map(product => ({
        product_id: product.product_id,
        product_name: product.product_name,
        quantity: product.quantity,
        unit_id: product.unit_id,
        unit_name: product.unit_name,
        price_while_added: product.price_while_added,
        latest_wholesaler_price: product.latest_wholesaler_price,
        price_updated_at: product.price_updated_at || undefined,
        is_active: product.is_active
      }))
    };

    console.log('Sending update request:', requestPayload);

    return this.http.post<ApiResponse<CartResponse>>(`${this.apiUrl}/UpdateCart`, requestPayload, { headers }).pipe(
      tap(response => console.log('Raw update response:', response)),
      map((response: ApiResponse<CartResponse>) => {
        if (response.status === 'error') {
          throw new Error(response.message);
        }
        console.log('Update successful, updating cart subject:', response.data);
        this.cartSubject.next(response.data!);
        return response.data!;
      }),
      catchError(error => {
        console.error('Error updating cart:', error);
        throw error;
      }),
      finalize(() => {
        this.pendingOperations.delete(operationKey);
        console.log('Update operation completed for:', operationKey);
      })
    );
  }

  // UPDATED: Actually remove the product from the array instead of just marking as inactive
  removeCartItem(cartId: number, productId: number): Observable<CartResponse> {
    const operationKey = this.createOperationKey('remove', cartId, productId);

    if (this.pendingOperations.has(operationKey)) {
      console.log('Remove operation already in progress, skipping...');
      return throwError(() => new Error('Remove operation already in progress'));
    }

    const currentCart = this.cartSubject.value;
    if (!currentCart) {
      return throwError(() => new Error('No cart data available'));
    }

    console.log('Removing product:', productId, 'from cart:', cartId);
    console.log('Current cart products before removal:', currentCart.products);

    // FIXED: Completely remove the product from the array instead of setting is_active to false
    const updatedProducts = currentCart.products.filter(product => product.product_id !== productId);

    console.log('Updated products after removal (filtered out product):', updatedProducts);

    // If no products left, we still need to update with empty array
    return this.updateCart({
      cart_id: cartId,
      products: updatedProducts
    }).pipe(
      tap(response => {
        console.log('Item removal successful:', response);
        console.log('Products in database after removal:', response.products);
      })
    );
  }

  updateProductQuantity(cartId: number, productId: number, newQuantity: number): Observable<CartResponse> {
    const operationKey = this.createOperationKey('quantity', cartId, productId);

    if (this.pendingOperations.has(operationKey)) {
      console.log('Quantity update already in progress, skipping...');
      return throwError(() => new Error('Quantity update already in progress'));
    }

    const currentCart = this.cartSubject.value;
    if (!currentCart) {
      return throwError(() => new Error('No cart data available'));
    }

    console.log('Updating quantity for product:', productId, 'to:', newQuantity);
    console.log('Current cart products before quantity update:', currentCart.products);

    // Update quantity for the specific product
    const updatedProducts = currentCart.products.map(product => ({
      product_id: product.product_id,
      product_name: product.product_name,
      quantity: product.product_id === productId ? newQuantity : product.quantity,
      unit_id: product.unit_id,
      unit_name: product.unit_name,
      price_while_added: product.price_while_added,
      latest_wholesaler_price: product.latest_wholesaler_price,
      price_updated_at: product.price_updated_at || undefined,
      is_active: product.is_active
    }));

    console.log('Updated products for quantity change:', updatedProducts);

    return this.updateCart({
      cart_id: cartId,
      products: updatedProducts
    }).pipe(
      tap(response => {
        console.log('Quantity update successful:', response);
      })
    );
  }

  getCurrentCart(): CartResponse | null {
    return this.cartSubject.value;
  }

  // Method to clear pending operations (useful for cleanup)
  clearPendingOperations(): void {
    this.pendingOperations.clear();
  }
}