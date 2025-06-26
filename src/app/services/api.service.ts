import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, params?: HttpParams | { [param: string]: string | number | boolean }): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { params });
  }

  post<T, B = any>(endpoint: string, body: B): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body);
  }

  put<T, B = any>(endpoint: string, body: B): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, body);
  }

  patch<T, B = any>(endpoint: string, body: B): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}/${endpoint}`, body);
  }

  delete<T>(endpoint: string, params?: HttpParams | { [param: string]: string | number | boolean }): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, { params });
  }

  // Optional method to set custom headers
  private createHeaders(headers?: { [key: string]: string }): HttpHeaders {
    let httpHeaders = new HttpHeaders();
    if (headers) {
      for (const key of Object.keys(headers)) {
        httpHeaders = httpHeaders.set(key, headers[key]);
      }
    }
    return httpHeaders;
  }
}
