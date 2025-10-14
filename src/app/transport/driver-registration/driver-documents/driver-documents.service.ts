import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { DriverRegistrationData, DriverDocument } from '../models/driver.models';

export interface DriverDocumentRequest {
  driver_id: number;
  doc_type: string;
  doc_image: string;
}

@Injectable({
  providedIn: 'root'
})
export class DriverDocumentsService {
  private apiUrl = environment.apiUrl;

  documentCategories = [
    'Identity Proof',
    'Address Proof',
    'License Document',
    'Medical Certificate',
    'Police Verification',
    'Education Certificate',
    'Experience Certificate',
    'Other'
  ];

  documentTypes = [
    'PDF',
    'Image',
    'Scanned Copy',
    'Original Photo'
  ];

  constructor(private http: HttpClient) { }

  // HTTP API Methods
  addDriverDocument(documentData: DriverDocumentRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/AddADriverDocument`, documentData)
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

  updateDocuments(documents: DriverDocument[]): void {
    const data = this.getRegistrationData();
    data.documents = documents;
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