import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

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

export interface BusinessType {
  b_typeid: number;
  b_typename: string;
  remarks: string;
}

@Injectable({ providedIn: 'root' })
export class AddBusinessService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getStates(): Observable<State[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<State[]>(`${this.apiUrl}/getStates`, { headers });
  }

  getCitiesOfState(stateId: number): Observable<City[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<City[]>(`${this.apiUrl}/getAllCitiesOfState/${stateId}`, { headers });
  }

  getLocationsByCity(cityId: number): Observable<Location[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Location[]>(`${this.apiUrl}/getLocationsByCity/${cityId}`, { headers });
  }

  // createBusinessesOfWholesaler(data: any): Observable<any> {
  //   const headers = this.getAuthHeaders();
  //   return this.http.post(`${this.apiUrl}/createBusinessBranch`, data, { headers });
  // }

  // modifyBusinessesOfWholesaler(data: any): Observable<any> {
  //   const headers = this.getAuthHeaders();
  //   return this.http.put(`${this.apiUrl}/updateBusinessBranch`, data, { headers });
  // }

  getBusinessTypes(): Observable<BusinessType[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<BusinessType[]>(`${this.apiUrl}/getBusinessTypes`, { headers });
  }
}