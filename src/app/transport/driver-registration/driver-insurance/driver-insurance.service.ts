import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { DriverRegistrationData, DriverInsurance } from '../models/driver.models';

export interface DriverInsuranceRequest {
  vehicle_id: number;
  frm_date: string;
  to_date: string;
  ins_company: string;
  amt_insured: number;
  driver_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class DriverInsuranceService {
  private apiUrl = environment.apiUrl;

  insuranceCompanies = [
    'ICICI Lombard General Insurance',
    'HDFC ERGO General Insurance',
    'Bajaj Allianz General Insurance',
    'TATA AIG General Insurance',
    'New India Assurance',
    'Oriental Insurance Company',
    'United India Insurance',
    'National Insurance Company',
    'Reliance General Insurance',
    'Future Generali India Insurance',
    'Cholamandalam MS General Insurance',
    'Royal Sundaram General Insurance',
    'SBI General Insurance',
    'Kotak Mahindra General Insurance',
    'Digit General Insurance',
    'Go Digit General Insurance',
    'Acko General Insurance',
    'Other'
  ];

  constructor(private http: HttpClient) { }

  // HTTP API Methods
  addDriverInsurance(insuranceData: DriverInsuranceRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/AddADriverInsurance`, insuranceData)
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

  updateInsurance(insurance: DriverInsurance[]): void {
    const data = this.getRegistrationData();
    data.insurance = insurance;
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