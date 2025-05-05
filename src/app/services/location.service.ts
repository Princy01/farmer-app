import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// location.model.ts
export interface Location {
  id: number;
  location: string | null;
  city_id: number;
  city_name: string | null;
  state_id: number;
  state_name: string | null;
}
@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private apiUrl = 'http://127.0.0.1:3000';

  constructor(private http: HttpClient) { }

  createLocation(location: Location): Observable<any> { // Or Observable<Location>
    return this.http.post(`${this.apiUrl}/locationDetails`, location)
      .pipe(catchError(this.handleError));
  }

  updateLocation(location: Location): Observable<any> { // Or Observable<Location>
    return this.http.put(`${this.apiUrl}/locationUpdate`, location)
      .pipe(catchError(this.handleError));
  }

  deleteLocation(id: number): Observable<any> { // Or Observable<void>
    return this.http.delete(`${this.apiUrl}/locationDelete/${id}`)
      .pipe(catchError(this.handleError));
  }

  getLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.apiUrl}/getLocations`)
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