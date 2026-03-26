import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout, retry } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface BusinessCategory {
  b_category_id: number;
  b_category_name: string;
}

export interface BusinessType {
  b_typeid: number;
  b_typename: string;
  remarks: string;
}

export interface State {
  id: number;
  state_name: string;
  state_shortname: string;
}

export interface City {
  id: number;
  city_shortname: string;
  city_name: string;
}

export interface Location {
  id: number;
  location_name: string | null;
  city_id: number;
  city_name: string | null;
  state_id: number;
  state_name: string | null;
}

export interface BusinessRegistrationPayload {
  bid: number | null;
  b_registration_num: string;
  b_owner_name: string;
  b_category_id: number;
  b_type_id: number;
  is_active: boolean;
  state_id: number;
  city_id: number;
  location_id: number;
  address: string;
  mobile_number: string;
  email: string;
  established_year: string;
  user_id: number;
  gst_number: string;
  pan_number: string;
  privileged_user: boolean;
}

@Injectable({ providedIn: 'root' })
export class BusinessRegistrationService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getBusinessCategories(): Observable<BusinessCategory[]> {
    return this.http.get<BusinessCategory[]>(`${this.apiUrl}/getBusinessCategory`)
      .pipe(
        timeout(30000),
        retry({
          count: 3,
          delay: (error, retryCount) => {
            const delayMs = Math.pow(2, retryCount - 1) * 1000;
            return throwError(() => error);
          }
        }),
        catchError(this.handleError)
      );
  }

  getStates(): Observable<State[]> {
    return this.http.get<State[]>(`${this.apiUrl}/getStates`)
      .pipe(
        timeout(30000),
        retry({ count: 3, delay: 1000 }),
        catchError(this.handleError)
      );
  }

  getCitiesOfState(stateId: number): Observable<City[]> {
    if (!stateId || stateId <= 0) {
      return throwError(() => new Error('Invalid state ID'));
    }
    return this.http.get<City[]>(`${this.apiUrl}/getAllCitiesOfState/${stateId}`)
      .pipe(
        timeout(30000),
        retry({ count: 3, delay: 1000 }),
        catchError(this.handleError)
      );
  }

  getLocationsByCity(cityId: number): Observable<Location[]> {
    if (!cityId || cityId <= 0) {
      return throwError(() => new Error('Invalid city ID'));
    }
    return this.http.get<Location[]>(`${this.apiUrl}/getLocationsByCity/${cityId}`)
      .pipe(
        timeout(30000),
        retry({ count: 3, delay: 1000 }),
        catchError(this.handleError)
      );
  }

  getBusinessTypes(): Observable<BusinessType[]> {
    return this.http.get<BusinessType[]>(`${this.apiUrl}/getBusinessTypes`)
      .pipe(
        timeout(30000),
        retry({ count: 3, delay: 1000 }),
        catchError(this.handleError)
      );
  }

  addNewBusiness(business: BusinessRegistrationPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/AddNewBusiness`, business)
      .pipe(
        timeout(30000),
        retry({
          count: 3,
          delay: (error, retryCount) => {
            const delayMs = Math.pow(2, retryCount - 1) * 1000;
            return throwError(() => error);
          }
        }),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    // Do not expose sensitive error details to user
    // Return the error object for components to handle appropriately
    return throwError(() => error);
  }
}