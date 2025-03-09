import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// vehicle.model.ts
export interface Vehicle {
  vehicle_id: number;
  insurance_id: number;
  vehicle_name: string;
  vehicle_manufacture_year: string;
  vehicle_warranty: string;
  vehicle_make: number;
  vehicle_model: number;
  vehicle_registration_no: string;
  vehicle_engine_type: number;
  vehicle_purchase_date: string; // Or Date
  vehicle_color: string;
  col1: string;
  col2: string;
  col3: string;
  vehicle_insurance_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private apiUrl = 'http://127.0.0.1:3000';

  constructor(private http: HttpClient) { }

  createVehicle(vehicle: Vehicle): Observable<any> { // Or Observable<Vehicle>
    return this.http.post(`${this.apiUrl}/vehicleDetails`, vehicle)
      .pipe(catchError(this.handleError));
  }

  updateVehicle(vehicle: Vehicle): Observable<any> { // Or Observable<Vehicle>
    return this.http.put(`${this.apiUrl}/vehicleUpdate`, vehicle)
      .pipe(catchError(this.handleError));
  }

  deleteVehicle(id: number): Observable<any> { // Or Observable<void>
    return this.http.delete(`${this.apiUrl}/vehicleDelete/${id}`)
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