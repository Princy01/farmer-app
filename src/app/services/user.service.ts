import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface User {
  role_id: number;
  name: string;
  mobile_num: string;
  email: string;
  address?: string;
  pincode?: string;
  location?: number;
  state?: number;
  active_status?: number;
}

export interface UserRead {
  user_id: number;
  role_id: number;
  role_name: string;
  name: string;
  mobile_num: string;
  email: string;
  address?: string;
  pincode?: string;
  location?: number;
  location_name?: string;
  state?: number;
  state_name?: string;
  active_status?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Fetch all users */
  getAllUsers(): Observable<UserRead[]> {
    return this.http.get<UserRead[]>(`${this.apiUrl}/getAllUsers`);
  }

  /** Create a new user */
  createUser(user: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/userTableDetails`, user);
  }

  /** Update an existing user */
  updateUserById(user: User): Observable<any> {
    return this.http.put(`${this.apiUrl}/usertableUpdate`, user);
  }

  /** Delete a user by ID */
  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`);
  }

  /** Fetch available locations */
  getLocations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getLocations`);
  }

  /** Fetch available states */
  getStates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getStates`);
  }

  /** Fetch user roles */
  getUserTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getUserTypes`);
  }
}
