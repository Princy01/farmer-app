import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface MandiProduct {
  mandi_name: string;
  mandi_address: string;
  city_name: string;
  state_name: string;
  mandi_incharge: string;
  mandi_incharge_num: string;
  product_name: string;
  quality_name?: string;
  wastage_measure_name?: string;
  product_id: number;
  id: number;
  wholesaler_id: number;
  current_stock: number;
  price_per_unit: number;
  date_of_entry: string;
  unit_name: string;
}

@Injectable({
  providedIn: 'root'
})
export class MandiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMandisByProduct(productId: number, cityId?: number): Observable<MandiProduct[]> {
    if (!productId || productId <= 0) {
      console.error('Invalid product ID provided');
      return throwError(() => new Error('Invalid product ID'));
    }

    let url = `${this.apiUrl}/GetMandisByProduct?product_id=${productId}`;
    if (cityId && cityId > 0) {
      url += `&city_id=${cityId}`;
    }

    return this.http.get<MandiProduct[]>(url).pipe(
      timeout(15000), // 15 second timeout
      catchError(error => {
        console.error('Error fetching mandis by product:', error);
        let errorMessage = 'Failed to fetch wholesaler information';

        if (error.name === 'TimeoutError') {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.status === 0) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.status === 404) {
          errorMessage = 'No wholesalers found for this product.';
        } else if (error.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }
}