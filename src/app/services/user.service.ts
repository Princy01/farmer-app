import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  userTypeID: number;
  name: string;
  mobileNum: string;
  email: string;
  address?: string;
  pincode?: string;
  location?: number;
  state?: number;
  status?: number;
}

export interface userRead{
  user_id: number;
  user_type_id: number;
  user_type_name: string;
  name: string;
  mobile_num: string;
  email: string;
  address?: string;
  pincode?: string;
  location?: number;
  location_name?: string;
  state?: number;
  state_name?: string;
  status?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://127.0.0.1:3000'; // Update this if needed

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/getUsers`);
  }

  insertUser(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/userTableDetails`, user);
  }

  updateUser(user: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/usertableUpdate`, user);
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${userId}`);
  }

  getLocations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/getLocations`);
  }

  getStates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/getStates`);
  }

  getUserTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/getUsers`);
  }
}
