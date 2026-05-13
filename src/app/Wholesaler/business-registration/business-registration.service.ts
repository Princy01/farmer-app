import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout, retry } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

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
  bid?: number | null;
  b_registration_num: string;
  is_active: boolean;
  user_id: number;
  pan_number: string;
  aadhaar_number?: string;
  government_license_number?: string;
  privileged_user?: boolean;
}

@Injectable({ providedIn: 'root' })
export class BusinessRegistrationService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

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
    return throwError(() => error);
  }
}