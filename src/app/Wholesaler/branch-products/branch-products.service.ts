import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { timeout, retryWhen, concatMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface BranchProduct {
  b_b_p_id: number;
  bid: number;
  product_id: number;
  product_name: string;
  image_path: string | null;
  current_stock: number;
  price_per_unit: number;
  unit_id: number;
  unit_name: string;
}

@Injectable({ providedIn: 'root' })
export class BranchProductsService {
  private apiUrl = environment.apiUrl;
  private readonly HTTP_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Gets authorization headers with Bearer token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Exponential backoff retry strategy for failed requests
   * Waits 1s, 2s, 4s before giving up
   */
  private exponentialBackoff() {
    return retryWhen(errors =>
      errors.pipe(
        concatMap((err, idx) => {
          if (idx < this.MAX_RETRIES) {
            const delayMs = Math.pow(2, idx) * 1000;
            return timer(delayMs);
          }
          return throwError(() => err);
        })
      )
    );
  }

  /**
   * Fetches products for a specific branch with retry and timeout
   * @param branchId - The branch ID to fetch products for
   * @returns Observable of branch products
   */
  getProductsByBranch(branchId: number): Observable<BranchProduct[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<BranchProduct[]>(`${this.apiUrl}/branch/${branchId}/products`, { headers })
      .pipe(
        timeout(this.HTTP_TIMEOUT),
        this.exponentialBackoff()
      ) as Observable<BranchProduct[]>;
  }

  /**
   * Adds a product to a branch with retry logic
   * @param bid - Branch ID
   * @param productId - Product ID
   * @param qualityId - Quality ID
   * @param wastageMeasureId - Wastage measure ID
   * @param currentStock - Current stock quantity
   * @param pricePerUnit - Price per unit
   * @param unitId - Unit ID
   * @returns Observable of the response
   */
  addProductToBranch(
    bid: number,
    productId: number,
    qualityId: number,
    wastageMeasureId: number,
    currentStock: number,
    pricePerUnit: number,
    unitId: number
  ): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = {
      bid,
      product_id: productId,
      quality_id: qualityId,
      wastage_measure_id: wastageMeasureId,
      current_stock: currentStock,
      price_per_unit: pricePerUnit,
      unit_id: unitId
    };
    return this.http
      .post<any>(`${this.apiUrl}/branch/product`, body, { headers })
      .pipe(timeout(this.HTTP_TIMEOUT), this.exponentialBackoff());
  }

  /**
   * Deletes a product from a branch (no retry on delete - destructive operation)
   * @param bid - Branch ID
   * @param productId - Product ID to delete
   * @returns Observable of the response
   */
  deleteProductFromBranch(bid: number, productId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = { bid, product_id: productId };
    return this.http.delete<any>(`${this.apiUrl}/branch/product`, { headers, body }).pipe(
      timeout(this.HTTP_TIMEOUT)
      // Note: No retry on DELETE as it's a destructive operation
    );
  }
}