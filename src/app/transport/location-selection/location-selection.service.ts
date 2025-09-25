import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface City {
  id: number;
  city_shortnames: string;
  city_name: string;
  state_name: string;
  state_id: number;
}

export interface BusinessBranch {
  branch_id: number;
  shop_name: string;
  address: string;
  email: string;
  number: string;
  established_year: string;
}

export interface LocationPreference {
  cities: number[];
  branches: number[];
}

@Injectable({
  providedIn: 'root'
})
export class LocationPreferenceService {
  private apiUrl = environment.apiUrl;
  private readonly STORAGE_KEY = 'driver_location_preferences';

  // BehaviorSubject to track current preferences
  private preferencesSubject = new BehaviorSubject<LocationPreference>({ cities: [], branches: [] });
  public preferences$ = this.preferencesSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.loadPreferencesFromStorage();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get all available cities
  getCities(): Observable<City[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<City[]>(`${this.apiUrl}/getAllCities`, { headers });
  }

  // Get business branches for a selected city
  getBusinessBranchesByCity(cityId: number): Observable<BusinessBranch[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<BusinessBranch[]>(`${this.apiUrl}/getAllBusinessBranchesByCity/${cityId}`, { headers });
  }

  // Get business branches for multiple cities
  getBusinessBranchesByCities(cityIds: number[]): Observable<{cityId: number, branches: BusinessBranch[]}[]> {
    const headers = this.getAuthHeaders();

    // Create observables for each city
    const requests = cityIds.map(cityId =>
      this.getBusinessBranchesByCity(cityId).pipe(
        map(branches => ({ cityId, branches }))
      )
    );

    // Combine all requests
    return forkJoin(requests);
  }

  // Save preferences to local storage
  savePreferences(preferences: LocationPreference): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
    this.preferencesSubject.next(preferences);
  }

  // Load preferences from local storage
  private loadPreferencesFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      const preferences = JSON.parse(stored);
      this.preferencesSubject.next(preferences);
    }
  }

  // Get current preferences
  getCurrentPreferences(): LocationPreference {
    return this.preferencesSubject.value;
  }

  // Clear all preferences
  clearPreferences(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.preferencesSubject.next({ cities: [], branches: [] });
  }

  // Check if preferences are set
  hasPreferences(): boolean {
    const prefs = this.getCurrentPreferences();
    return prefs.cities.length > 0 || prefs.branches.length > 0;
  }
}