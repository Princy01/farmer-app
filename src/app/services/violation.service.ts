import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface Violation {
  id: number;
  violation_name: string;
  level_of_serious: string;
  status: number; // Or boolean, if you convert it in the service
}
@Injectable({
  providedIn: 'root'
})
export class ViolationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  createViolation(violation: Violation): Observable<any> { // Or Observable<Violation>
    return this.http.post(`${this.apiUrl}/violationDetails`, violation)
      .pipe(catchError(this.handleError));
  }

  updateViolation(violation: Violation): Observable<any> { // Or Observable<Violation>
    return this.http.put(`${this.apiUrl}/violationUpdate`, violation)
      .pipe(catchError(this.handleError));
  }

  deleteViolation(id: number): Observable<any> { // Or Observable<void>
    return this.http.delete(`${this.apiUrl}/violationDelete/${id}`)
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