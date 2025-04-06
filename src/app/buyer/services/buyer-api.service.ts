import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/services/api.service';

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

@Injectable({
  providedIn: 'root'
})
export class BuyerApiService {
  constructor(private api: ApiService) {}

  getCategories(): Observable<Category[]> {
    return this.api.get<Category[]>('getCategories');
  }

  getCategoryById(categoryId: number): Observable<Category> {
    return this.api.get<Category>(`getCategories/${categoryId}`);
  }

  getProductRegionalNameById(id: number): Observable<ProductRegional> {
    return this.api.get<ProductRegional>(`getProductCategoryRegionalName/${id}`);
  }

  getAllProducts(): Observable<Product[]> {
    return this.api.get<Product[]>('getProducts');
  }

  getProductById(productId: number): Observable<Product> {
    return this.api.get<Product>(`getProducts/${productId}`);
  }

  getProductsByCategoryId(categoryId: number): Observable<Product[]> {
    return this.api.get<Product[]>(`getProductByCatId/${categoryId}`);
  }

  getProductCategoryRegionalById(id: number): Observable<CategoryRegionalLanguage> {
    return this.api.get<CategoryRegionalLanguage>(`getProductCategoryRegional/${id}`);
  }

  getModeOfPayments(): Observable<PaymentMode[]> {
    return this.api.get<PaymentMode[]>('getModeOfPayments');
  }
}
