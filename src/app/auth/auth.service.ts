import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface UserResponse {
  user_id: string;
  name: string;
  mobile_num: string;
  email: string;
  address: string;
  pincode: string;
  location: number;
  state: number;
  active_status: number;
  role_id: number;
}

export interface UserRegistration {
  name: string;
  password: string;

  // We use identifier in the form, but send either email or mobile_num to the backend
  identifier?: string;  // The field users interact with
  email?: string;       // Backend field if identifier is an email
  mobile_num?: string;  // Backend field if identifier is a phone number

  address: string;
  pincode: string;
  location: number;
  state: number;
  role_id: number;
  active_status: number;
}

export interface AuthResponse {
  message: string;
  role_id: number;
  access_token: string;
  refresh_token: string;
}

export interface Location {
  id: number;
  location: string;
  city_id?: number;
  city_name?: string;
  state_id?: number;
}

export interface State {
  id: number;
  state: string;
  state_shortnames?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:3000';
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';

  constructor(private http: HttpClient) { }

  login(credentials: LoginCredentials): Observable<any> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.access_token) {
            localStorage.setItem(this.tokenKey, response.access_token);
          }
          if (response.refresh_token) {
            localStorage.setItem(this.refreshTokenKey, response.refresh_token);
          }
        })
      );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh-token`, { refresh_token: refreshToken })
      .pipe(
        tap(response => {
          if (response.access_token) {
            localStorage.setItem(this.tokenKey, response.access_token);
          }
          if (response.refresh_token) {
            localStorage.setItem(this.refreshTokenKey, response.refresh_token);
          }
        }),
        catchError(error => {
          // If refresh fails, log the user out
          this.logout();
          return throwError(() => error);
        })
      );
  }

  registerUser(userData: UserRegistration): Observable<any> {
    const url = `${this.apiUrl}/auth/register-user`;

    return this.http.post(url, userData)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.apiUrl}/getLocations`)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  getStates(): Observable<State[]> {
    return this.http.get<State[]>(`${this.apiUrl}/getStates`)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }
}