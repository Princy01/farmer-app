import { Injectable } from '@angular/core';
import { map, Observable, of, tap, catchError, throwError } from 'rxjs';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

// Language-related interfaces
interface Language {
  id: number;
  code: string;
  name: string;
}

interface UserPreference {
  language: string;
}

interface AvailableTranslations {
  id: number;
  code: string;
}

interface TranslationResponse {
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class TranslateApiService {
  private readonly apiUrl = environment.apiUrl;
  readonly translateApiUrl = environment.translateApiUrl;

  availableTranslations: AvailableTranslations[] = [];
  preferredLanguage: Language | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {
    this.initializeTranslations();
  }

  private initializeTranslations(): void {
    this.getAvailableTranslations()
      .pipe(
        catchError(error => {
          console.error('Failed to load available translations:', error);
          return of([]);
        })
      )
      .subscribe(translations => {
        this.availableTranslations = translations;
      });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error('TranslateApiService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  getLanguages(): Observable<Language[]> {
    return this.http.get<Language[]>(`${this.apiUrl}/getAllLanguages`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getUserPreference(): Observable<Language> {
    return this.http.get<Language>(
      `${this.apiUrl}/getUserLanguagePreference`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(pref => {
        this.preferredLanguage = pref ?? null;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  setLanguagePreference(langId: number): Observable<any> {
    if (!langId || langId <= 0) {
      return throwError(() => new Error('Invalid language ID'));
    }

    console.log('Setting language preference to ID:', langId);
    return this.http.post(
      `${this.apiUrl}/setUserLanguagePreference`,
      { lang_id: langId },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getAvailableTranslations(): Observable<AvailableTranslations[]> {
    return of([{ id: 1, code: 'en' }, { id: 2, code: 'hi' }]);
    // Uncomment when API is ready:
    // return this.http.get<AvailableTranslations[]>(
    //   `${this.translateApiUrl}/available-translations`
    // ).pipe(
    //   catchError(this.handleError.bind(this))
    // );
  }

  checkTranslationExists(targetLangCode: string): boolean {
    if (!targetLangCode || typeof targetLangCode !== 'string') {
      return false;
    }
    return this.availableTranslations.some(
      lang => lang.code.toUpperCase() === targetLangCode.toUpperCase()
    );
  }


  getTranslation(data: any, targetLangCode: string): Observable<any> {
    if (!data) {
      return of(null);
    }

    if (!targetLangCode || !this.checkTranslationExists(targetLangCode)) {
      // If translation doesn't exist, return original data
      return of(data);
    }

    const source = targetLangCode.toUpperCase();

    return this.http.post<TranslationResponse>(
      `${this.translateApiUrl}/translate`,
      data,
      {
        params: { source },
        headers: this.getAuthHeaders()
      }
    ).pipe(
      map(response => response?.data ?? data),
      catchError(error => {
        console.error('Translation failed, returning original data:', error);
        // Return original data if translation fails
        return of(data);
      })
    );
  }

  getPreferredLanguage(): Language | null {
    return this.preferredLanguage;
  }

  getCachedAvailableTranslations(): AvailableTranslations[] {
    return [...this.availableTranslations];
  }
}