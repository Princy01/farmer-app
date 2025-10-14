import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { DriverRegistrationData, VehicleType, DriverVehicle } from '../models/driver.models';

export interface DriverVehicleRequest {
  veh_number: string;
  reg_date: string;
  state: string;
  type_id: number;
  veh_make: string;
  veh_model: string;
  driver_id: number;
  load_capacity: number;
  fuel_type: string;
  rc_document: string;
  kms_travelled: number;
}

@Injectable({
  providedIn: 'root'
})
export class DriverVehicleService {
  private apiUrl = environment.apiUrl;

  vehicleTypes: VehicleType[] = [
    { type_id: '1', type_name: 'Motorcycle' },
    { type_id: '2', type_name: 'Auto Rickshaw' },
    { type_id: '3', type_name: 'Car' },
    { type_id: '4', type_name: 'Mini Truck' },
    { type_id: '5', type_name: 'Light Commercial Vehicle' },
    { type_id: '6', type_name: 'Heavy Commercial Vehicle' },
    { type_id: '7', type_name: 'Bus' },
    { type_id: '8', type_name: 'Tractor' },
    { type_id: '9', type_name: 'Trailer' },
    { type_id: '10', type_name: 'Other' }
  ];

  fuelTypes = [
    'Petrol',
    'Diesel',
    'CNG',
    'Electric',
    'Hybrid',
    'LPG'
  ];

  vehicleMakes = [
    'Tata', 'Mahindra', 'Ashok Leyland', 'Eicher', 'Bajaj', 'TVS',
    'Hero', 'Honda', 'Yamaha', 'Suzuki', 'Hyundai', 'Maruti',
    'Ford', 'Chevrolet', 'Toyota', 'Other'
  ];

  constructor(private http: HttpClient) { }

  // HTTP API Methods
  addDriverVehicle(vehicleData: DriverVehicleRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/AddADriverVehicle`, vehicleData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Local Storage Methods
  getRegistrationData(): DriverRegistrationData {
    const data = localStorage.getItem('driverRegistrationData');
    if (data) {
      return JSON.parse(data);
    }
    return this.getDefaultRegistrationData();
  }

  updateVehicles(vehicles: DriverVehicle[]): void {
    const data = this.getRegistrationData();
    data.vehicles = vehicles;
    this.saveRegistrationData(data);
  }

  setCurrentStep(step: number): void {
    const data = this.getRegistrationData();
    data.currentStep = step;
    this.saveRegistrationData(data);
  }

  private saveRegistrationData(data: DriverRegistrationData): void {
    localStorage.setItem('driverRegistrationData', JSON.stringify(data));
  }

  private getDefaultRegistrationData(): DriverRegistrationData {
    return {
      driverInfo: {} as any,
      documents: [],
      vehicles: [],
      insurance: [],
      currentStep: 1,
      isCompleted: false
    };
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