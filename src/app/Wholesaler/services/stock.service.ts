import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError, retry } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface Stock {
  id: number;
  productName: string;
  currentStock: number;
  price: number;
}

export interface ProductPriceData {
  product_id: number;
  product_name: string;
  category_id: number;
  category_name: string;
  price_per_unit: number;
  current_stock: number;
  unit_id: number;
  units_name: string;
  last_date_of_entry: string;
}

export interface BusinessBranchWithNames {
  branch_id: number;
  shop_name: string;
  location_name: string;
  state_name: string;
  city_name: string;
  address: string;
}

export interface AddStockPayload {
  product_id: number;
  quality_id: number;
  wastage_measure_id: number;
  stock_received: number;
  stock_carried_forward: number;
  price_per_unit: number;
  b_b_id: number;
  date_of_entry: string;
  unit_id: number;
}

export interface UpdateStockPayload {
  product_id: number;
  new_quantity: number;
  mandi_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = environment.apiUrl;

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

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while processing your request.';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          break;
        case 403:
          errorMessage = 'Access denied. Insufficient permissions.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Server error: ${error.status}`;
      }
    }

    console.error('Stock Service Error:', errorMessage, error);
    return throwError(() => error);
  }

  getProductsStockOfBranchForDate(branchId: number, date: string): Observable<ProductPriceData[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ProductPriceData[]>(
      `${this.apiUrl}/getAllProductsStockOfBusinessBranchOfTheDate/${branchId}/${date}`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  getBranchesByUser(userId: number): Observable<BusinessBranchWithNames[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<BusinessBranchWithNames[]>(
      `${this.apiUrl}/getAllBusinessBranchesWithNamesByUser?userId=${userId}`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  addStock(data: AddStockPayload): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(
      `${this.apiUrl}/addStockPriceDataForBusinessBranch`,
      data,
      { headers }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  updateStock(data: UpdateStockPayload): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(
      `${this.apiUrl}/wholesaler/product/update-stock-mandi`,
      data,
      { headers }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getProducts(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(
      `${this.apiUrl}/getAllProducts`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  getQualities(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(
      `${this.apiUrl}/getAllQualityLevels`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  getWastageMeasures(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(
      `${this.apiUrl}/getAllWastageMeasures`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  getUnits(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(
      `${this.apiUrl}/getAllUnits`,
      { headers }
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }
}