import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginCredentials {
  email: string;
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
  mobile_num: string;
  email: string;
  address?: string;
  pincode?: string;
  location?: number;
  state?: number;
  active_status: number;
  role_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:3000';

  constructor(private http: HttpClient) {}

  login(credentials: LoginCredentials): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/InsertLoginCredentials`, credentials);
  }

  registerUser(userData: UserRegistration): Observable<any> {
    return this.http.post(`${this.apiUrl}/userTableDetails`, userData);
  }
}