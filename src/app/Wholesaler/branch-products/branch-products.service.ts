import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getProductsByBranch(branchId: number): Observable<BranchProduct[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<BranchProduct[]>(`${this.apiUrl}/branch/${branchId}/products`, { headers });
  }

  addProductToBranch(bid: number, productId: number, qualityId: number, wastageMeasureId: number, currentStock: number, pricePerUnit: number, unitId: number): Observable<any> {
  const headers = this.getAuthHeaders();
  const body = { bid, product_id: productId, quality_id: qualityId, wastage_measure_id: wastageMeasureId, current_stock: currentStock, price_per_unit: pricePerUnit, unit_id: unitId };
  return this.http.post(`${this.apiUrl}/branch/product`, body, { headers });
}

  deleteProductFromBranch(bid: number, productId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = { bid, product_id: productId };
    return this.http.delete(`${this.apiUrl}/branch/product`, { headers, body });
  }
}