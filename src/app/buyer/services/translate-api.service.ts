import { Injectable } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root'
})
export class TranslateApiService {
  private apiUrl = environment.apiUrl;
  private translateApiUrl = environment.translateApiUrl;

  availableTranslations: AvailableTranslations[] = [];
  preferredLanguage: Language | null = null;

  constructor(private http: HttpClient, private authService: AuthService) {
        // Pre-fetch available translations
        this.getAvailableTranslations().subscribe(translations => {
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

  getLanguages(): Observable<Language[]> {
    return this.http.get<Language[]>(`${this.apiUrl}/getAllLanguages`);
  }

  getUserPreference(): Observable<Language> {
    return this.http.get<Language>(`${this.apiUrl}/getUserLanguagePreference`, { headers: this.getAuthHeaders() }).pipe(
        tap(pref => {
            // Store preferred language for easy access
            this.preferredLanguage = pref ?? null;
        }));
  }

  setLanguagePreference(langId: number): Observable<any> {
    console.log('Setting language preference to ID:', langId);
    return this.http.post(`${this.apiUrl}/setUserLanguagePreference`, { lang_id: langId }, { headers: this.getAuthHeaders() });
  }

  getAvailableTranslations(): Observable<AvailableTranslations[]> {
        return of([{ id: 1, code: 'en' }, { id: 2, code: 'hi' }]);
//     return this.http.get<AvailableTranslations[]>(`${this.translateApiUrl}/available-translations`);
  }

  checkTranslationExists(targetLangCode: string): boolean {
        return this.availableTranslations.some(lang => lang.code.toUpperCase() === targetLangCode.toUpperCase());
  }

    getTranslation(data: any, targetLangCode: string): Observable<any> {
        if (!this.checkTranslationExists(targetLangCode)) {
            // If translation doesn't exist, return original data
            return of(data);
        }

        // Determine source language based on target (assuming EN<->HI translation)
        const source = targetLangCode.toUpperCase();

        return this.http.post<any>(`${this.translateApiUrl}/translate`, data, {
            params: { source },
            headers: this.getAuthHeaders()
        }).pipe(
            map(response => response.data)
        );

}
}