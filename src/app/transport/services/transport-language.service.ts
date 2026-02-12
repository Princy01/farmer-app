import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

// Language-related interfaces
export interface Language {
  id: number;
  code: string;
  name: string;
}

export interface UserPreference {
  language: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransportLanguageService {
  private readonly apiUrl = environment.apiUrl;
  preferredLanguage: Language | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  /**
   * Get authorization headers with Bearer token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error('TransportLanguageService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Get all available languages
   * @returns Observable of Language array
   */
  getLanguages(): Observable<Language[]> {
    return this.http.get<Language[]>(
      `${this.apiUrl}/getAllLanguages`
    ).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get user's language preference from backend
   * @returns Observable of UserPreference
   */
  getUserPreference(): Observable<UserPreference> {
    return this.http.get<UserPreference>(
      `${this.apiUrl}/getUserLanguagePreference`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      retry(1),
      tap(pref => {
        console.log('User language preference:', pref);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Set user's language preference in backend
   * @param langId - The ID of the language to set
   * @returns Observable of the response
   */
  setLanguagePreference(langId: number): Observable<any> {
    if (!langId || langId <= 0) {
      return throwError(() => new Error('Invalid language ID'));
    }

    console.log('Setting transport user language preference to ID:', langId);
    return this.http.post(
      `${this.apiUrl}/setUserLanguagePreference`,
      { lang_id: langId },
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(response => {
        console.log('Language preference updated successfully:', response);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get language code from localStorage
   * @returns The language code (e.g., 'en', 'hi') or 'en' as default
   */
  getStoredLanguageCode(): string {
    const stored = localStorage.getItem('appLang') || 'en';
    return stored.toLowerCase();
  }

  /**
   * Save language code to localStorage
   * @param langCode - The language code to save (e.g., 'en', 'hi')
   */
  saveLanguageCode(langCode: string): void {
    localStorage.setItem('appLang', langCode.toLowerCase());
  }
}
