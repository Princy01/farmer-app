import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface City {
  id: number;
  name: string;
  state: string;
}

export interface Mandi {
  id: number;
  name: string;
  city_id: number;
  city_name: string;
  location: string;
}

export interface LocationPreference {
  cities: number[];
  mandis: number[];
}

@Injectable({
  providedIn: 'root'
})
export class LocationPreferenceService {
  private apiUrl = environment.apiUrl;
  private readonly STORAGE_KEY = 'driver_location_preferences';

  // BehaviorSubject to track current preferences
  private preferencesSubject = new BehaviorSubject<LocationPreference>({ cities: [], mandis: [] });
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
    return this.http.get<City[]>(`${this.apiUrl}/locations/cities`, { headers });
  }

  // Get mandis for selected cities
  getMandisByCities(cityIds: number[]): Observable<Mandi[]> {
    const headers = this.getAuthHeaders();
    const params = cityIds.map(id => `city_ids=${id}`).join('&');
    return this.http.get<Mandi[]>(`${this.apiUrl}/locations/mandis?${params}`, { headers });
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
    this.preferencesSubject.next({ cities: [], mandis: [] });
  }

  // Check if preferences are set
  hasPreferences(): boolean {
    const prefs = this.getCurrentPreferences();
    return prefs.cities.length > 0 || prefs.mandis.length > 0;
  }
}