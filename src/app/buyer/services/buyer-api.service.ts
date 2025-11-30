import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';
export interface Category {
  category_id: number;
  category_name: string;
  super_cat_id?: number;
  img_path?: string;
  active_status?: number;
  category_regional_id?: number;
}

export interface PaymentMode {
  id: number;
  payment_mode: string;
}

export interface Product {
  nutrition_factor: string;
  description: string;
  product_id: number;
  category_id: number;
  category_name: string;
  product_name: string;
  image_path: string;
  active_status: number;
  product_regional_id: number;
  product_regional_name: string;
}

export interface ProductRegional {
  id: number;
  language_id: number;
  product_id: number;
  product_name: string;
  product_regional_name: string;
}

export interface CategoryRegionalLanguage {
  id: number;
  language_id: number;
  regional_name: string;
}

export interface CategoryWithSubCategories {
  subcategories: Category[];
  category_id: number;
  category_name: string;
  super_cat_id?: number;
  img_path?: string;
  active_status?: number;
  category_regional_id?: number;
}

export interface ProductAll {
  product_id: number;
  product_name: string;
  cat_id: number;
  cat_name: string;
  image_path: string;
  active_status: number;
  nutrition_factor: string;
  description?: string;
}

// Language-related interfaces
interface Language {
  id: number;
  code: string;
  name: string;
}

interface UserPreference {
  language: string; // Adjust based on backend response (e.g., if it returns ID or code)
}

@Injectable({
  providedIn: 'root'
})
export class BuyerApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {} // Add AuthService injection

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getCategoryBySuperCategoryId(superCatId: number): Observable<Category[]> {
  return this.http.get<Category[]>(`${this.apiUrl}/getCategoriesBySupID/${superCatId}`);
}

  getProductsByCategoryId(categoryId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/getProductByCatId/${categoryId}`);
  }

  getAllProductsOfSuperCategory(superCatId: number): Observable<ProductAll[]> {
    return this.http.get<ProductAll[]>(`${this.apiUrl}/getAllProductsOfSuperCategory/${superCatId}`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/getCategories`);
  }

  getCategoryById(categoryId: number): Observable<CategoryWithSubCategories> {
    return this.http.get<CategoryWithSubCategories>(`${this.apiUrl}/getCategories/${categoryId}`);
  }

  getProductRegionalNameById(id: number): Observable<ProductRegional> {
    return this.http.get<ProductRegional>(`${this.apiUrl}/getProductCategoryRegionalName/${id}`);
  }

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/getProducts`);
  }

  getProductById(productId: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/getProducts/${productId}`);
  }

  getProductCategoryRegionalById(id: number): Observable<CategoryRegionalLanguage> {
    return this.http.get<CategoryRegionalLanguage>(`${this.apiUrl}/getProductCategoryRegional/${id}`);
  }

  getModeOfPayments(): Observable<PaymentMode[]> {
    return this.http.get<PaymentMode[]>(`${this.apiUrl}/getModeOfPayments`);
  }

  getSuperCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/getSuperCategories`);
  }
}