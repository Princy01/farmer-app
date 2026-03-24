import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, timeout, retryWhen, concatMap, finalize } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface WholesalerProfile {
  id: number;
  name: string;
  email: string | null;
  mobile: string | null;
  address: string | null;
  location: string | null;
  location_id: number | null;
  state_id: number | null;
  state_name: string | null;
  pincode: string | null;
  status: string;
  profile_image: string | null;
  total_branches: number;
  member_since: string | null;
}

export interface UpdateUserProfileRequest {
  name: string;
  email: string;
  mobile: string;
  address: string;
  state_name: string;
  city_name: string;
  location_name: string;
  pincode: string;
}

@Injectable({
  providedIn: 'root'
})
export class WholesalerProfileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getProfile(): Observable<WholesalerProfile> {
    const headers = this.getAuthHeaders();
    return this.http.get<WholesalerProfile>(`${this.apiUrl}/wholesaler/profile`, { headers }).pipe(
      timeout(30000),
      retryWhen(errors => errors.pipe(
        concatMap((err, idx) => idx < 3 ? timer(Math.pow(2, idx) * 1000) : throwError(() => err)),
        finalize(() => {})
      )),
      catchError(this.handleError.bind(this))
    );
  }

  updateProfile(profileData: UpdateUserProfileRequest): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/wholesaler/profile`, profileData, { headers }).pipe(
      timeout(30000),
      retryWhen(errors => errors.pipe(
        concatMap((err, idx) => idx < 3 ? timer(Math.pow(2, idx) * 1000) : throwError(() => err)),
        finalize(() => {})
      )),
      catchError(this.handleError.bind(this))
    );
  }

  uploadProfileImage(imageBase64: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/wholesaler/profile/image`, { image: imageBase64 }, { headers }).pipe(
      timeout(30000),
      retryWhen(errors => errors.pipe(
        concatMap((err, idx) => idx < 3 ? timer(Math.pow(2, idx) * 1000) : throwError(() => err)),
        finalize(() => {})
      )),
      catchError(this.handleError.bind(this))
    );
  }

  private handleError(error: HttpErrorResponse | any): Observable<never> {
    let userFriendlyMessage = 'An error occurred. Please try again.';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      if (error.error.message.includes('timeout')) {
        userFriendlyMessage = 'PROFILE.TIMEOUT';
      } else {
        userFriendlyMessage = 'PROFILE.NETWORK_ERROR';
      }
    } else if (error.message && error.message.includes('timeout')) {
      userFriendlyMessage = 'PROFILE.TIMEOUT';
    } else {
      // Backend returned an unsuccessful response code
      switch (error.status) {
        case 0:
          userFriendlyMessage = 'PROFILE.NETWORK_ERROR';
          break;
        case 401:
          userFriendlyMessage = 'PROFILE.SESSION_EXPIRED';
          break;
        case 403:
          userFriendlyMessage = 'PROFILE.PERMISSION_DENIED';
          break;
        case 404:
          userFriendlyMessage = 'PROFILE.NOT_FOUND';
          break;
        case 408:
          userFriendlyMessage = 'PROFILE.TIMEOUT';
          break;
        case 500:
        case 502:
        case 503:
          userFriendlyMessage = 'PROFILE.SERVER_ERROR';
          break;
        default:
          userFriendlyMessage = error.error?.message || 'An error occurred. Please try again.';
      }
    }

    return throwError(() => new Error(userFriendlyMessage));
  }
}