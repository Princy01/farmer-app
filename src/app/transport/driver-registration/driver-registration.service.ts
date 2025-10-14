import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface DriverInfoRequest {
  first_name: string;
  last_name: string;
  licence_no: string;
  licence_issed_date: string;
  licence_expiry_datedate: string;
  licence_type: string;
  address_door_no: string;
  address_street: string;
  address_town: string;
  address_state: string;
  address_pin_code: string;
  address_landmark: string;
  contact_num: string;
  contact_num_addl: string;
  email: string;
  aadhar: string;
  pan: string;
  bank_ac_no: string;
  bank_name: string;
  bank_branch: string;
  ifsc: string;
  bank_address: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class DriverHttpService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  addDriver(driverData: DriverInfoRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/AddADriver`, driverData)
      .pipe(
        catchError(this.handleError)
      );
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
      if (error.error && error.error.error) {
        errorMessage = error.error.error;
      }

      return throwError(() => new Error(errorMessage));
    }
  }
}