import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface RetailerProfile {
  id: number;
  name: string;
  email: string | null;
  mobile: string | null;
  address: string | null;
  location_id: number | null;
  location: string | null;
  state_id: number | null;
  state_name: string | null;
  city_id: number | null;
  city_name: string | null;
  pincode: string | null;
  status: string;
  member_since: string | null;
  total_branches: number;
  profile_image?: string | null;
}

export interface UpdateUserProfileRequest {
  name: string;
  email: string;
  mobile: string;
  address: string;
  state_id?: number | null;
  state_name: string;
  city_id?: number | null;
  city_name: string;
  location_id?: number | null;
  location_name: string;
  pincode: string;
}

@Injectable({
  providedIn: 'root'
})
export class RetailerProfileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getProfile(): Observable<RetailerProfile> {
    const headers = this.getAuthHeaders();
    return this.http.get<RetailerProfile>(`${this.apiUrl}/retailer/profile`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateProfile(profileData: UpdateUserProfileRequest): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/retailer/profile`, profileData, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  uploadProfileImage(imageBase64: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/retailer/profile/image`, { image: imageBase64 }, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    // Return error response so component can handle it with user-friendly messages
    // DO NOT return technical messages - let component translate errors
    return throwError(() => error);
  }
}