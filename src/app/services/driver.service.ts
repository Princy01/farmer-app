import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, take } from 'rxjs';
import { catchError } from 'rxjs/operators';

// driver.model.ts
export interface Driver {
  driver_id: number;
  driver_name: string;
  driver_age: number | null; // Allow null values
  driver_license: string;
  driver_number: string;
  driver_address: string | null;
  driver_status: string | null;
  date_of_joining: string | null; // Or Date
  experience_years: number | null;
  vehicle_id: number | null;
  license_expiry_date: string; // Or Date
  emergency_contact: string | null;
  assigned_route_id: number | null;
  col1: string | null;
  col2: string | null;
  d_o_b: string | null; // Or Date
  violation: number | null;
}

export interface DriverRead{
  driver_id: number;
  driver_name: string;
  driver_age: number;
  driver_license: string;
  driver_number: string;
  driver_address: string;
  driver_status: string;
  date_of_joining: string | null;
  experience_years: number;
  license_expiry_date: string | null;
  emergency_contact: string;
  assigned_route_id: number | null;
  d_o_b: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private apiUrl = 'http://127.0.0.1:3000';

  constructor(private http: HttpClient) { }

   getDrivers(): Observable<DriverRead[]> {
    // dummy data
    return of([
      {
        driver_id: 1,
        driver_name: "Rajesh Kumar",
        driver_age: 45,
        driver_license: "DL123456789",
        driver_number: "9876543210",
        driver_address: "123, MG Road, Pune",
        driver_status: "Active",
        date_of_joining: "2015-06-20",
        experience_years: 10,
        vehicle_id: 101,
        license_expiry_date: "2027-12-15",
        emergency_contact: "9876543211",
        assigned_route_id: 5,
        d_o_b: "1979-05-12",
        violation: 0,
      },
      {
        driver_id: 2,
        driver_name: "Amit Sharma",
        driver_age: 38,
        driver_license: "DL987654321",
        driver_number: "8765432109",
        driver_address: "456, Baner Road, Pune",
        driver_status: "Inactive",
        date_of_joining: "2018-09-10",
        experience_years: 6,
        vehicle_id: 102,
        license_expiry_date: "2025-08-22",
        emergency_contact: "8765432108",
        assigned_route_id: null,
        d_o_b: "1986-02-18",
        violation: 2,
      }
    ]);

      return this.http.get<any[]>(`${this.apiUrl}/getDrivers`)
    }

      // code to get value from Backend
    getVehicles(): Observable<any[]> {
      return this.http.get<any[]>(`${this.apiUrl}/getVehicles`)
    }

  createDriver(driver: Driver): Observable<any> { // Or Observable<Driver>
    return this.http.post(`${this.apiUrl}/driverDetails`, driver)
      .pipe(take(1),catchError(this.handleError));
  }

  updateDriver(driver: Driver): Observable<any> { // Or Observable<Driver>
    return this.http.put(`${this.apiUrl}/driverUpdate`, driver)
      .pipe(catchError(this.handleError));
  }

  deleteDriver(id: number): Observable<any> { // Or Observable<void>
    return this.http.delete(`${this.apiUrl}/driverDelete/${id}`)
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