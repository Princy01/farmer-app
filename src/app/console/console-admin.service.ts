import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ConsoleCity,
  ConsoleLocation,
  ConsoleModuleAccessResponse,
  ConsoleModuleUsersResponse,
  ConsoleState,
} from './console-admin.models';

@Injectable({
  providedIn: 'root',
})
export class ConsoleAdminService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getStates(): Observable<ConsoleState[]> {
    return this.http.get<ConsoleState[]>(`${this.apiUrl}/getStates`);
  }

  createState(payload: { state_name: string; state_shortname: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/stateDetails`, payload);
  }

  getCities(): Observable<ConsoleCity[]> {
    return this.http.get<ConsoleCity[]>(`${this.apiUrl}/getAllCities`);
  }

  createCity(payload: { city_name: string; city_shortname: string; state_id: number }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/addCity`, payload);
  }

  getLocations(): Observable<ConsoleLocation[]> {
    return this.http.get<ConsoleLocation[]>(`${this.apiUrl}/getLocations`);
  }

  createLocation(payload: { location_name: string; state_id: number; city_id: number }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/locationDetails`, payload);
  }

  getModuleUsers(): Observable<ConsoleModuleUsersResponse> {
    return this.http.get<ConsoleModuleUsersResponse>(`${this.apiUrl}/admin/dispute-modules/users`);
  }

  getActiveModuleAccess(): Observable<ConsoleModuleAccessResponse> {
    const params = new HttpParams().set('is_active', 'true');
    return this.http.get<ConsoleModuleAccessResponse>(`${this.apiUrl}/admin/dispute-modules/access`, { params });
  }

  grantModuleAccess(payload: { user_id: number; module_code: string; reason: string }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/admin/dispute-modules/access/grant`, payload);
  }

  revokeModuleAccess(payload: { user_id: number; module_code: string; reason: string }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/admin/dispute-modules/access/revoke`, payload);
  }
}
