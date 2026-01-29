import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError, retry } from 'rxjs/operators';
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
 //TRANSLATION RELATED INTERFACES
interface Language {
  id: number;
  code: string;
  name: string;
}

interface UserPreference {
  language: string;
}

@Injectable({
  providedIn: 'root'
})
export class BuyerApiService {
  private readonly apiUrl = environment.apiUrl;
  private readonly retryCount = 1; // Retry failed requests once

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'ERRORS.UNKNOWN_ERROR';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      console.error('Client-side error:', error.error.message);
      errorMessage = 'ERRORS.NETWORK_ERROR';
    } else {
      // Backend error
      console.error(`Backend error: ${error.status}, ${error.message}`);

      switch (error.status) {
        case 400:
          errorMessage = 'ERRORS.BAD_REQUEST';
          break;
        case 401:
          errorMessage = 'ERRORS.UNAUTHORIZED';
          break;
        case 403:
          errorMessage = 'ERRORS.FORBIDDEN';
          break;
        case 404:
          errorMessage = 'ERRORS.NOT_FOUND';
          break;
        case 500:
          errorMessage = 'ERRORS.SERVER_ERROR';
          break;
        case 503:
          errorMessage = 'ERRORS.SERVICE_UNAVAILABLE';
          break;
        default:
          errorMessage = 'ERRORS.UNKNOWN_ERROR';
      }
    }

    return throwError(() => ({ message: errorMessage, status: error.status }));
  }

  getCategoryBySuperCategoryId(superCatId: number): Observable<Category[]> {
    if (!superCatId || superCatId <= 0) {
      return throwError(() => ({ message: 'ERRORS.INVALID_CATEGORY_ID', status: 400 }));
    }

    return this.http.get<Category[]>(
      `${this.apiUrl}/getCategoriesBySupID/${superCatId}`
    ).pipe(
      retry(this.retryCount),
      catchError(this.handleError.bind(this))
    );
  }

  getProductsByCategoryId(categoryId: number): Observable<Product[]> {
    if (!categoryId || categoryId <= 0) {
      return throwError(() => ({ message: 'ERRORS.INVALID_CATEGORY_ID', status: 400 }));
    }

    return this.http.get<Product[]>(
      `${this.apiUrl}/getProductByCatId/${categoryId}`
    ).pipe(
      retry(this.retryCount),
      catchError(this.handleError.bind(this))
    );
  }

  getAllProductsOfSuperCategory(superCatId: number): Observable<ProductAll[]> {
    if (!superCatId || superCatId <= 0) {
      return throwError(() => ({ message: 'ERRORS.INVALID_CATEGORY_ID', status: 400 }));
    }

    return this.http.get<ProductAll[]>(
      `${this.apiUrl}/getAllProductsOfSuperCategory/${superCatId}`
    ).pipe(
      retry(this.retryCount),
      catchError(this.handleError.bind(this))
    );
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(
      `${this.apiUrl}/getCategories`
    ).pipe(
      retry(this.retryCount),
      catchError(this.handleError.bind(this))
    );
  }

  getCategoryById(categoryId: number): Observable<CategoryWithSubCategories> {
    if (!categoryId || categoryId <= 0) {
      return throwError(() => ({ message: 'ERRORS.INVALID_CATEGORY_ID', status: 400 }));
    }

    return this.http.get<CategoryWithSubCategories>(
      `${this.apiUrl}/getCategories/${categoryId}`
    ).pipe(
      retry(this.retryCount),
      catchError(this.handleError.bind(this))
    );
  }

  getProductRegionalNameById(id: number): Observable<ProductRegional> {
    if (!id || id <= 0) {
      return throwError(() => ({ message: 'ERRORS.INVALID_ID', status: 400 }));
    }

    return this.http.get<ProductRegional>(
      `${this.apiUrl}/getProductCategoryRegionalName/${id}`
    ).pipe(
      retry(this.retryCount),
      catchError(this.handleError.bind(this))
    );
  }

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(
      `${this.apiUrl}/getProducts`
    ).pipe(
      retry(this.retryCount),
      catchError(this.handleError.bind(this))
    );
  }

  getProductById(productId: number): Observable<Product> {
    if (!productId || productId <= 0) {
      return throwError(() => ({ message: 'ERRORS.INVALID_PRODUCT_ID', status: 400 }));
    }

    return this.http.get<Product>(
      `${this.apiUrl}/getProducts/${productId}`
    ).pipe(
      retry(this.retryCount),
      catchError(this.handleError.bind(this))
    );
  }

  getProductCategoryRegionalById(id: number): Observable<CategoryRegionalLanguage> {
    if (!id || id <= 0) {
      return throwError(() => ({ message: 'ERRORS.INVALID_ID', status: 400 }));
    }

    return this.http.get<CategoryRegionalLanguage>(
      `${this.apiUrl}/getProductCategoryRegional/${id}`
    ).pipe(
      retry(this.retryCount),
      catchError(this.handleError.bind(this))
    );
  }

  getModeOfPayments(): Observable<PaymentMode[]> {
    return this.http.get<PaymentMode[]>(
      `${this.apiUrl}/getModeOfPayments`
    ).pipe(
      retry(this.retryCount),
      catchError(this.handleError.bind(this))
    );
  }

  getSuperCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(
      `${this.apiUrl}/getSuperCategories`
    ).pipe(
      retry(this.retryCount),
      catchError(this.handleError.bind(this))
    );
  }
}