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
}