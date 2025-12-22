import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  id: number
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
    let url = `${this.apiUrl}/GetMandisByProduct?product_id=${productId}`;
    if (cityId) {
      url += `&city_id=${cityId}`;
    }
    return this.http.get<MandiProduct[]>(url);
  }
}