import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface WholesalerProfile {
  id: number;
  name: string;
  email: string | null;
  mobile: string | null;
  address: string | null;
  location: string | null;
  pincode: string | null;
  status: string;
  profile_image: string | null;
  total_branches: number;
  member_since: string;
}

export interface UpdateUserProfileRequest {
  name: string;
  email: string;
  mobile: string;
  address: string;
  location: number;
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
      catchError(this.handleError)
    );
  }

  updateProfile(profileData: UpdateUserProfileRequest): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/wholesaler/profile`, profileData, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  uploadProfileImage(imageBase64: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/wholesaler/profile/image`, { image: imageBase64 }, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(errorMessage);
  }
}