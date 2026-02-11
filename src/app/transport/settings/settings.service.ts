import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface DriverNotificationSettings {
  delivery_reminder: boolean;
  payment_received: boolean;
  system_alerts: boolean;
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
export class SettingsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getNotificationSettings(): Observable<DriverNotificationSettings> {
    return this.http.get<DriverNotificationSettings>(`${this.apiUrl}/driver/settings/notifications`)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateNotificationSettings(settings: DriverNotificationSettings): Observable<any> {
    return this.http.put(`${this.apiUrl}/driver/settings/notifications`, settings)
      .pipe(
        catchError(this.handleError)
      );
  }

  updatePassword(req: UpdatePasswordRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/driver/settings/password`, req)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteAccount(req: DeleteAccountRequest): Observable<any> {
    return this.http.delete(`${this.apiUrl}/driver/account`, { body: req })
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }
}