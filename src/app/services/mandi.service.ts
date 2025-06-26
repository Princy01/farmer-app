import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface Mandi {
  mandi_id: number;
  mandi_location: string;
  mandi_incharge: string;
  mandi_incharge_num: string;
  mandi_pincode: string;
  mandi_address: string;
  mandi_state_id: number;
  state_name: string;
  state_shortnames: string;
  mandi_name: string;
  mandi_shortnames: string;
  mandi_city_id: number;
  city_name: string;
  city_shortnames: string;
}


@Injectable({
  providedIn: 'root'
})
export class MandiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  createMandi(mandi: Mandi): Observable<any> {
    return this.http.post(`${this.apiUrl}/mandiDetails`, mandi)
      .pipe(catchError(this.handleError));
  }

  updateMandi(mandi: Mandi): Observable<any> {
    return this.http.put(`${this.apiUrl}/mandiUpdate`, mandi)
      .pipe(catchError(this.handleError));
  }

  deleteMandi(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/mandiDelete/${id}`)
      .pipe(catchError(this.handleError));
  }

  getAllMandis(): Observable<Mandi[]> {
    return this.http.get<Mandi[]>(`${this.apiUrl}/getMandiDetails`);
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