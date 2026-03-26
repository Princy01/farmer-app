import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface UserSettings {
  orderUpdates: boolean;
  priceAlerts: boolean;
  stockAlerts: boolean;
  marketingEmails: boolean;
  smsNotifications: boolean;
  autoRefresh: boolean;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface DeleteAccountRequest {
  password: string;
  confirmation: string;
}

@Injectable({
  providedIn: 'root'
})
export class RetailerSettingsService {
  private apiUrl = environment.apiUrl + '/retailer';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Removed getBackendConfig - not in backend

  getSettings(): Observable<UserSettings> {
    const headers = this.getAuthHeaders();
    return this.http.get<UserSettings>(`${this.apiUrl}/settings`, { headers }).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }

  updateSettings(settings: UserSettings): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/settings`, settings, { headers }).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }

  changePassword(data: UpdatePasswordRequest): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/settings/password`, data, { headers }).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }

  deleteAccount(data: DeleteAccountRequest): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/account`, { headers, body: data }).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred. Please try again.';
    if (error.error && typeof error.error === 'object' && error.error.error) {
      errorMessage = error.error.error; // Match backend error format
    }
    return throwError(() => new Error(errorMessage));
  }
}