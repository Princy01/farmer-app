import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface CartItem {
  selected_id: number;
  product_id: number;
  product_name: string;
  wholesaler_id: number;
  branch_id: number;
  image_path: string;
  wholesaler_name: string;
  unit_id: number;
  unit_name: string;
  price: number;
  quantity: number;
  is_deleted: boolean;
}

export interface AddCartItemRequest {
  wholesaler_id: number;
  branch_id?: number;
  product_id: number;
  quantity: number;
  unit_id: number;
  price: number;
}

export interface UpdateCartItemRequest {
  selected_item_id: number;
  quantity: number;
}

export interface GetCartRequest {
  doe: string; // Date of entry in format YYYY-MM-DD
}

export interface DeleteCartItemRequest {
  product_id: number; // selected_id from backend
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = environment.apiUrl;
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItemsSubject.asObservable();

  private pendingOperations = new Set<string>();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private createOperationKey(operation: string, itemId?: number): string {
    return `${operation}-${itemId || 'all'}`;
  }

  /**
   * Get cart items for a specific date
   * @param doe Date in format YYYY-MM-DD (defaults to today)
   */
  getCartItems(doe?: string): Observable<CartItem[]> {
    const headers = this.getAuthHeaders();

    // Default to today's date if not provided
    const dateOfEntry = doe || new Date().toISOString().split('T')[0];

    const payload: GetCartRequest = {
      doe: dateOfEntry
    };

    console.log('Fetching cart items for date:', dateOfEntry);

    return this.http.post<CartItem[]>(
      `${this.apiUrl}/GetSelectedItemsFromCart`,
      payload,
      { headers }
    ).pipe(
      tap((items) => {
        console.log('Cart items fetched successfully:', items);
        // Filter out deleted items
        const activeItems = items.filter(item => !item.is_deleted);
        this.cartItemsSubject.next(activeItems);
      }),
      map((items) => items.filter(item => !item.is_deleted)),
      catchError(error => {
        console.error('Error fetching cart items:', error);
        this.cartItemsSubject.next([]);
        return throwError(() => error);
      })
    );
  }

  addItemToCart(item: AddCartItemRequest): Observable<any> {
    const operationKey = this.createOperationKey('add', item.product_id);

    if (this.pendingOperations.has(operationKey)) {
      console.log('Add operation already in progress, skipping...');
      return throwError(() => new Error('Add operation already in progress'));
    }

    this.pendingOperations.add(operationKey);
    const headers = this.getAuthHeaders();

    console.log('Adding item to cart:', item);

    return this.http.post<{ message: string; selected_id: number }>(
      `${this.apiUrl}/AddSelectedItemToCart`,
      item,
      { headers }
    ).pipe(
      tap((response) => {
        console.log('Item added successfully:', response);
        console.log('Selected ID:', response.selected_id);
      }),
      catchError(error => {
        console.error('Error adding item to cart:', error);
        return throwError(() => error);
      }),
      finalize(() => {
        this.pendingOperations.delete(operationKey);
      })
    );
  }


  updateItemQuantity(selectedItemId: number, quantity: number): Observable<any> {
    const operationKey = this.createOperationKey('update', selectedItemId);

    if (this.pendingOperations.has(operationKey)) {
      console.log('Update operation already in progress, skipping...');
      return throwError(() => new Error('Update operation already in progress'));
    }

    this.pendingOperations.add(operationKey);
    const headers = this.getAuthHeaders();

    const updateRequest: UpdateCartItemRequest = {
      selected_item_id: selectedItemId,
      quantity: quantity
    };

    console.log('=== Updating Item Quantity ===');
    console.log('Request Payload:', JSON.stringify(updateRequest, null, 2));

    return this.http.post<{ message: string; selected_item_id: number; new_quantity: number }>(
      `${this.apiUrl}/UpdateCartItemQuantity`,
      updateRequest,
      { headers }
    ).pipe(
      tap((response) => {
        console.log('=== Item Updated Successfully ===');
        console.log('Response:', response);
      }),
      catchError(error => {
        console.error('=== Error Updating Item ===');
        console.error('Error:', error);
        return throwError(() => error);
      }),
      finalize(() => {
        this.pendingOperations.delete(operationKey);
      })
    );
  }


  deleteCartItem(selectedId: number): Observable<any> {
    const operationKey = this.createOperationKey('delete', selectedId);

    if (this.pendingOperations.has(operationKey)) {
      console.log('Delete operation already in progress, skipping...');
      return throwError(() => new Error('Delete operation already in progress'));
    }

    this.pendingOperations.add(operationKey);
    const headers = this.getAuthHeaders();

    const payload: DeleteCartItemRequest = {
      product_id: selectedId // Backend expects product_id but uses it as selected_id
    };

    console.log('Deleting cart item:', selectedId);

    return this.http.post<{ message: string }>(
      `${this.apiUrl}/DeleteSelectedItemFromCart`,
      payload,
      { headers }
    ).pipe(
      tap((response) => {
        console.log('Item deleted successfully:', response);

        // Update local state by removing the item
        const currentItems = this.cartItemsSubject.value;
        const updatedItems = currentItems.filter(item => item.selected_id !== selectedId);
        this.cartItemsSubject.next(updatedItems);
      }),
      catchError(error => {
        console.error('Error deleting cart item:', error);
        return throwError(() => error);
      }),
      finalize(() => {
        this.pendingOperations.delete(operationKey);
      })
    );
  }

  /**
   * Get current cart items from the BehaviorSubject
   */
  getCurrentCartItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  /**
   * Get total price of all items in cart
   */
  getTotalPrice(): number {
    const items = this.cartItemsSubject.value;
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  /**
   * Get total item count
   */
  getTotalItemCount(): number {
    return this.cartItemsSubject.value.length;
  }

  /**
   * Clear pending operations
   */
  clearPendingOperations(): void {
    this.pendingOperations.clear();
  }

  /**
   * Clear cart items from local state
   */
  clearCart(): void {
    this.cartItemsSubject.next([]);
  }
}