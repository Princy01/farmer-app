import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface Category {
  category_id: number;
  category_name: string;
  super_cat_id: number | null;
  remarks: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // getCategories(): Observable<any[]> {
  //   return of([
  //     { category_id: 1, category_name: 'Category 1', super_cat_id: 1, col1: 'Col 1', col2: 'Col 2', remarks: 'Remarks 1' },
  //     { category_id: 2, category_name: 'Category 2', super_cat_id: 2, col1: 'Col 1', col2: 'Col 2', remarks: 'Remarks 2' }
  //   ]);
  // }

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getCategories`)
      .pipe(catchError(this.handleError));
  }

  // code to get value from Backend
  getSuperCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getSuperCategories`)
      .pipe(catchError(this.handleError));
  }

  createCategory(category: Category): Observable<any> { // Or Observable<Category>
    return this.http.post(`${this.apiUrl}/categoryDetails`, category)
      .pipe(catchError(this.handleError));
  }

  updateCategory(category: Category): Observable<any> {
    return this.http.put(`${this.apiUrl}/categoryUpdate`, category)
      .pipe(catchError(this.handleError));
  }

  deleteCategory(id: number): Observable<any> { // Or Observable<void>
    return this.http.delete(`${this.apiUrl}/categoryDelete/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
      return throwError(() => new Error('Something went wrong. Please try again later.'));
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);

        let errorMessage = 'Something went wrong. Please try again later.';
        if(error.error && error.error.message){
            errorMessage = error.error.message;
        }

      return throwError(() => new Error(errorMessage));
    }
  }
}