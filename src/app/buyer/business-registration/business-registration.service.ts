import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

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
  bid?: number | null;
  b_registration_num: string;
  b_owner_name: string;
  b_category_id: number;
  b_type_id: number;
  is_active: boolean;
  mobile_number: string;
  email: string;
  established_year: string;
  user_id: number;
  gst_number: string;
  pan_number: string;
  aadhaar_number?: string;
  government_license_number?: string;
  privileged_user?: boolean;
}

@Injectable({ providedIn: 'root' })
export class BusinessRegistrationService {
        private apiUrl = environment.apiUrl;

        constructor(private http: HttpClient, private authService: AuthService) { }

        private getAuthHeaders(): HttpHeaders {
                const token = this.authService.getToken();
                return new HttpHeaders({
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                });
        }

        getBusinessCategories(): Observable<BusinessCategory[]> {
                return this.http.get<BusinessCategory[]>(`${this.apiUrl}/getBusinessCategory`);
        }

        getStates(): Observable<State[]> {
                return this.http.get<State[]>(`${this.apiUrl}/getStates`);
        }

        getCitiesOfState(stateId: number): Observable<City[]> {
                return this.http.get<City[]>(`${this.apiUrl}/getAllCitiesOfState/${stateId}`);
        }

        getLocationsByCity(cityId: number): Observable<Location[]> {
                return this.http.get<Location[]>(`${this.apiUrl}/getLocationsByCity/${cityId}`);
        }

        getBusinessTypes(): Observable<BusinessType[]> {
                return this.http.get<BusinessType[]>(`${this.apiUrl}/getBusinessTypes`);
        }

        addNewBusiness(business: any): Observable<any> {
                return this.http.post<any>(`${this.apiUrl}/AddNewBusiness`, business);
        }

        getBusinessExistsOrNot(): Observable<boolean> {
                const headers = this.getAuthHeaders();
                return this.http.get<boolean>(
                        `${this.apiUrl}/getBusinessExistsOrNot`,
                        { headers }
                );
        }
}