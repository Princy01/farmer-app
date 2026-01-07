import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface ProductAll {
  product_id: number;
  product_name: string;
  cat_id: number;
  cat_name: string;
  image_path: string | null;
  active_status: number;
  nutrition_factor: string;
}

export interface Unit {
  unit_id: number;
  units_name: string;
}
@Injectable({ providedIn: 'root' })
export class AddProductService {
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

  getAllProductsForAdmin(): Observable<ProductAll[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ProductAll[]>(`${this.apiUrl}/getAllProductsForAdmin`, { headers });
  }

  addProductToBranch(bid: number, productId: number, qualityId: number, wastageMeasureId: number, currentStock: number, pricePerUnit: number, unitId: number): Observable<any> {
  const headers = this.getAuthHeaders();
  const body = { bid, product_id: productId, quality_id: qualityId, wastage_measure_id: wastageMeasureId, current_stock: currentStock, price_per_unit: pricePerUnit, unit_id: unitId };
  return this.http.post(`${this.apiUrl}/branch/product`, body, { headers });
}

getAllUnits(): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.apiUrl}/getAllUnits`);
  }
}