import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface UserResponse {
  user_id: number;
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
  identifier: string;
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
  location_name: string | null;
  city_id: number;
  city_name: string | null;
  state_id: number;
  state_name: string | null;
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

export interface RegistrationResponse {
  message: string;
  user_id?: number;
  email_verification_required?: boolean;
  verification_sent?: boolean;
}

export interface LoginResponse {
  message: string;
  role_id?: number;
  access_token?: string;
  refresh_token?: string;
  error?: string;
  email_verification_required?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private accessTokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  private roleKey = 'user_role';
  private userIdKey = 'user_id';

  constructor(private http: HttpClient) { }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.access_token && response.refresh_token) {
            this.setAuthData(response.access_token, response.refresh_token, response.role_id!);
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
            localStorage.setItem(this.accessTokenKey, response.access_token);
            // Extract and store user ID from new token
            const userId = this.extractUserIdFromToken(response.access_token);
            if (userId) {
              localStorage.setItem(this.userIdKey, userId.toString());
            }
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

  registerUser(userData: UserRegistration): Observable<RegistrationResponse> {
    const url = `${this.apiUrl}/auth/register-user`;
    return this.http.post<RegistrationResponse>(url, userData)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  setAuthData(accessToken: string, refreshToken: string, roleId: number): void {
    localStorage.setItem(this.accessTokenKey, accessToken);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
    localStorage.setItem(this.roleKey, this.mapRoleIdToRole(roleId));

    // Extract user ID from JWT token
    const userId = this.extractUserIdFromToken(accessToken);
    if (userId) {
      localStorage.setItem(this.userIdKey, userId.toString());
    }
  }

  private extractUserIdFromToken(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id || null;
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }

  // Map role IDs to role names
  private mapRoleIdToRole(roleId: number): string {
    const roleMap: { [key: number]: string } = {
      1: 'admin',
      2: 'wholesaler',
      3: 'retailer',
      4: 'driver'
    };
    return roleMap[roleId] || 'unknown';
  }

  // Enhanced logout method
  logout(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.userIdKey);
    // Remove any legacy keys
    localStorage.removeItem('auth_token');
    localStorage.removeItem('wholesalerId');
  }

  // Updated authentication check methods
  getToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  // New helper methods
  getUserRole(): string | null {
    return localStorage.getItem(this.roleKey);
  }

  getUserId(): number | null {
    const userId = localStorage.getItem(this.userIdKey);
    return userId ? parseInt(userId, 10) : null;
  }

  getRoleId(): number | null {
    const role = this.getUserRole();
    const roleMap: { [key: string]: number } = {
      'admin': 1,
      'wholesaler': 2,
      'retailer': 3,
      'driver': 4
    };
    return role ? roleMap[role] || null : null;
  }

  // Check if token is expired
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.getUserRole() === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  getStates(): Observable<State[]> {
    return this.http.get<State[]>(`${this.apiUrl}/getStates`)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  getCitiesOfState(stateId: number): Observable<City[]> {
    return this.http.get<City[]>(`${this.apiUrl}/getAllCitiesOfState/${stateId}`)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  getLocationsByCity(cityId: number): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.apiUrl}/getLocationsByCity/${cityId}`)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/verify-email`, { token });
  }

  resendVerification(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/resend-verification`, { email });
  }
}