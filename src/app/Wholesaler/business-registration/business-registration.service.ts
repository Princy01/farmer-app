import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

@Injectable({ providedIn: 'root' })
export class BusinessRegistrationService {
        private apiUrl = environment.apiUrl;

        constructor(private http: HttpClient) { }

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

        addNewBusiness(business: any) {
                return this.http.post<any>(`${this.apiUrl}/AddNewBusiness`, business);
        }
}