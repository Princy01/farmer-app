import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, retry, timer, of } from 'rxjs';
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
  message?: string;
  role_id: number;
  access_token: string;
  refresh_token?: string;
}

export interface Location {
  id: number;
  location_name: string | null;
  location_name_en?: string | null;
  city_id: number;
  city_name: string | null;
  city_name_en?: string | null;
  state_id: number;
  state_name: string | null;
  state_name_en?: string | null;
  language_code?: string;
}

export interface State {
  id: number;
  state_name: string;
  state_shortname: string;
  state_name_en?: string;
  language_code?: string;
}

export interface City {
  id: number;
  city_shortname: string;
  city_name: string;
  city_name_en?: string;
  language_code?: string;
}

export interface RegistrationResponse {
  message: string;
  user_id?: number;
  email_verification_required?: boolean;
  verification_sent?: boolean;
  verification_token?: string; // FOR TESTING ONLY - Token for email verification
}

export interface LoginResponse {
  message: string;
  role_id?: number;
  access_token?: string;
  refresh_token?: string;
  error?: string;
  email_verification_required?: boolean;
}

export interface VerifyEmailResponse {
  message: string;
  verified: boolean;
}

export interface ResendVerificationResponse {
  message: string;
  verification_sent: boolean;
  verification_token?: string; // FOR TESTING ONLY
}

export interface RequestPasswordResetResponse {
  message: string;
  expires_in_seconds: number;
  resend_after_seconds: number;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
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

  // Caching for reference data (24-hour TTL)
  private statesCache: Map<string, State[]> = new Map();
  private statesCacheTime: Map<string, number> = new Map();
  private citiesCache: Map<string, City[]> = new Map();
  private citiesCacheTime: Map<string, number> = new Map();
  private locationsCache: Map<string, Location[]> = new Map();
  private locationsCacheTime: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

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
          if (response.role_id) {
            localStorage.setItem(this.roleKey, this.mapRoleIdToRole(response.role_id));
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
      // Silently fail - invalid token format
      return null;
    }
  }

  // Map role IDs to role names
  private mapRoleIdToRole(roleId: number): string {
    const roleMap: { [key: number]: string } = {
      1: 'admin',
      2: 'wholesaler',
      3: 'retailer',
      4: 'driver',
      6: 'ops_l1',
      8: 'finance',
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

    // Clear caches on logout
    this.clearReferenceDataCache();
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
      'driver': 4,
      'ops_l1': 6,
      'finance': 8,
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

  clearReferenceDataCache(): void {
    this.statesCache.clear();
    this.statesCacheTime.clear();
    this.citiesCache.clear();
    this.citiesCacheTime.clear();
    this.locationsCache.clear();
    this.locationsCacheTime.clear();
  }

  getStates(): Observable<State[]> {
    // Return cached data if still valid
    const now = Date.now();
    const lang = this.getPreferredLanguage();
    const cached = this.statesCache.get(lang);
    const cacheTime = this.statesCacheTime.get(lang) || 0;

    if (cached && (now - cacheTime) < this.CACHE_DURATION) {
      return of(cached);
    }

    return this.http.get<State[]>(`${this.apiUrl}/getStates`)
      .pipe(
        retry({ count: 3, delay: (error, count) => timer(Math.pow(2, count) * 1000) }),
        tap(states => {
          // Update cache
          this.statesCache.set(lang, states);
          this.statesCacheTime.set(lang, now);
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  getCitiesOfState(stateId: number): Observable<City[]> {
    // Return cached data if still valid
    const now = Date.now();
    const lang = this.getPreferredLanguage();
    const cacheKey = `${lang}:${stateId}`;
    const cached = this.citiesCache.get(cacheKey);
    const cacheTime = this.citiesCacheTime.get(cacheKey) || 0;

    if (cached && (now - cacheTime) < this.CACHE_DURATION) {
      return of(cached);
    }

    return this.http.get<City[]>(`${this.apiUrl}/getAllCitiesOfState/${stateId}`)
      .pipe(
        retry({ count: 3, delay: (error, count) => timer(Math.pow(2, count) * 1000) }),
        tap(cities => {
          // Update cache
          this.citiesCache.set(cacheKey, cities);
          this.citiesCacheTime.set(cacheKey, now);
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  getLocationsByCity(cityId: number): Observable<Location[]> {
    // Return cached data if still valid
    const now = Date.now();
    const lang = this.getPreferredLanguage();
    const cacheKey = `${lang}:${cityId}`;
    const cached = this.locationsCache.get(cacheKey);
    const cacheTime = this.locationsCacheTime.get(cacheKey) || 0;

    if (cached && (now - cacheTime) < this.CACHE_DURATION) {
      return of(cached);
    }

    return this.http.get<Location[]>(`${this.apiUrl}/getLocationsByCity/${cityId}`)
      .pipe(
        retry({ count: 3, delay: (error, count) => timer(Math.pow(2, count) * 1000) }),
        tap(locations => {
          // Update cache
          this.locationsCache.set(cacheKey, locations);
          this.locationsCacheTime.set(cacheKey, now);
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  verifyEmail(token: string): Observable<VerifyEmailResponse> {
    return this.http.post<VerifyEmailResponse>(`${this.apiUrl}/auth/verify-email`, { token });
  }

  resendVerification(email: string): Observable<ResendVerificationResponse> {
    return this.http.post<ResendVerificationResponse>(`${this.apiUrl}/auth/resend-verification`, { email });
  }

  requestPasswordReset(email: string): Observable<RequestPasswordResetResponse> {
    const normalizedEmail = this.normalizeEmail(email);
    return this.http.post<RequestPasswordResetResponse>(
      `${this.apiUrl}/auth/forgot-password/request`,
      { email: normalizedEmail }
    );
  }

  resendPasswordReset(email: string): Observable<RequestPasswordResetResponse> {
    const normalizedEmail = this.normalizeEmail(email);
    return this.http.post<RequestPasswordResetResponse>(
      `${this.apiUrl}/auth/forgot-password/resend`,
      { email: normalizedEmail }
    );
  }

  resetPasswordWithCode(payload: ResetPasswordPayload): Observable<ResetPasswordResponse> {
    const normalizedEmail = this.normalizeEmail(payload.email);
    const code = payload.code?.trim();
    const newPassword = payload.newPassword ?? '';

    return this.http.post<ResetPasswordResponse>(
      `${this.apiUrl}/auth/forgot-password/reset`,
      {
        email: normalizedEmail,
        code,
        new_password: newPassword
      }
    );
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private getPreferredLanguage(): string {
    const rawLang = (
      localStorage.getItem('preferred_language') ||
      localStorage.getItem('appLang') ||
      'en'
    ).toLowerCase();
    const baseLang = rawLang.split('-')[0];
    const supportedLangs = ['en', 'hi', 'te', 'ta', 'kn', 'ml', 'or', 'mr', 'gu', 'bn', 'pa', 'ur'];

    return supportedLangs.includes(baseLang) ? baseLang : 'en';
  }
}
