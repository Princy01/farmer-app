import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, timer } from 'rxjs';
import { map, catchError, tap, finalize, timeout, retry } from 'rxjs/operators';
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

  // Configuration for network resilience
  private readonly HTTP_TIMEOUT = 30000; // 30 seconds
  private readonly RETRY_ATTEMPTS = 3;
  private readonly INITIAL_BACKOFF = 1000; // 1 second

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
   * Implements exponential backoff retry strategy
   * Attempts: 1s → 2s → 4s delays between retries
   */
  private getRetryStrategy() {
    return retry({
      count: this.RETRY_ATTEMPTS,
      delay: (error, retryCount) => {
        const delayMs = this.INITIAL_BACKOFF * Math.pow(2, retryCount);
        return timer(delayMs);
      }
    });
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

    return this.http.post<CartItem[]>(
      `${this.apiUrl}/GetSelectedItemsFromCart`,
      payload,
      { headers }
    ).pipe(
      timeout(this.HTTP_TIMEOUT),
      this.getRetryStrategy(),
      tap((items) => {
        // Filter out deleted items
        const activeItems = (items as CartItem[]).filter(item => !item.is_deleted);
        this.cartItemsSubject.next(activeItems);
      }),
      map((items) => (items as CartItem[]).filter(item => !item.is_deleted)),
      catchError(error => {
        this.cartItemsSubject.next([]);
        return throwError(() => error);
      })
    );
  }

  addItemToCart(item: AddCartItemRequest): Observable<any> {
    const operationKey = this.createOperationKey('add', item.product_id);

    if (this.pendingOperations.has(operationKey)) {
      return throwError(() => new Error('Add operation already in progress'));
    }

    this.pendingOperations.add(operationKey);
    const headers = this.getAuthHeaders();

    return this.http.post<{ message: string; selected_id: number }>(
      `${this.apiUrl}/AddSelectedItemToCart`,
      item,
      { headers }
    ).pipe(
      timeout(this.HTTP_TIMEOUT),
      this.getRetryStrategy(),
      catchError(error => {
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
      return throwError(() => new Error('Update operation already in progress'));
    }

    this.pendingOperations.add(operationKey);
    const headers = this.getAuthHeaders();

    const updateRequest: UpdateCartItemRequest = {
      selected_item_id: selectedItemId,
      quantity: quantity
    };

    return this.http.post<{ message: string; selected_item_id: number; new_quantity: number }>(
      `${this.apiUrl}/UpdateCartItemQuantity`,
      updateRequest,
      { headers }
    ).pipe(
      timeout(this.HTTP_TIMEOUT),
      this.getRetryStrategy(),
      catchError(error => {
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
      return throwError(() => new Error('Delete operation already in progress'));
    }

    this.pendingOperations.add(operationKey);
    const headers = this.getAuthHeaders();

    const payload: DeleteCartItemRequest = {
      product_id: selectedId // Backend expects product_id but uses it as selected_id
    };

    return this.http.post<{ message: string }>(
      `${this.apiUrl}/DeleteSelectedItemFromCart`,
      payload,
      { headers }
    ).pipe(
      timeout(this.HTTP_TIMEOUT),
      this.getRetryStrategy(),
      tap((response) => {
        // Update local state by removing the item
        const currentItems = this.cartItemsSubject.value;
        const updatedItems = currentItems.filter(item => item.selected_id !== selectedId);
        this.cartItemsSubject.next(updatedItems);
      }),
      catchError(error => {
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