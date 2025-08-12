import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../auth/auth.service';

export interface Business {
  bid?: number;
  email: string;
  mobile_number: string;
  address: string;
  is_active: boolean;
  user_id?: number;
}

export interface BusinessUpdateRequest {
  email: string;
  mobile_number: string;
  address: string;
  is_active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BusinessUpdateService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  updateBusiness(businessData: BusinessUpdateRequest): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.post(`${this.apiUrl}/UpdateBusiness`, businessData, { headers })
      .pipe(
        catchError(error => {
          console.error('Business update failed:', error);
          return throwError(() => error);
        })
      );
  }
}