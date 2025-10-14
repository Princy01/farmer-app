import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { DriverRegistrationData, DriverInfo } from '../models/driver.models';

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
export class DriverBasicInfoService {
  private apiUrl = environment.apiUrl;

  indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh'
  ];

  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  licenseTypes = [
    'Learner License (LL)',
    'Permanent License (DL)',
    'Commercial License (CDL)',
    'Heavy Vehicle License (HMV)',
    'Transport License (TRAN)'
  ];

  constructor(private http: HttpClient) { }

  // HTTP API Methods
  addDriver(driverData: DriverInfoRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/AddADriver`, driverData)
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

  updateDriverInfo(driverInfo: DriverInfo): void {
    const data = this.getRegistrationData();
    data.driverInfo = driverInfo;
    this.saveRegistrationData(data);
  }

  setCurrentStep(step: number): void {
    const data = this.getRegistrationData();
    data.currentStep = step;
    this.saveRegistrationData(data);
  }

  calculateAge(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  private saveRegistrationData(data: DriverRegistrationData): void {
    localStorage.setItem('driverRegistrationData', JSON.stringify(data));
  }

  private getDefaultRegistrationData(): DriverRegistrationData {
    return {
      driverInfo: {} as DriverInfo,
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