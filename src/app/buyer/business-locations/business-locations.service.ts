import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface BusinessLocation {
    branch_id: number;
    bid: number;
    shop_name: string;
    type_id: number;
    location: number;
    state: number;
    b_city_id: number;
    address: string;
    email: string;
    number: string;
    gst_num: string;
    pan_num: string;
    privilege_user: boolean;
    established_year: string;
    created_at: string;
    updated_at: string;
    active_status: boolean;
}

export interface BusinessBranchWithNames {
    branch_id: number;
    bid: number;
    shop_name: string;
    type_id: number;
    location_id: number;
    location_name: string;
    state_id: number;
    state_name: string;
    state_shortname: string;
    city_id: number;
    city_name: string;
    city_shortname: string;
    address: string;
    email: string;
    number: string;
    gst_num: string;
    pan_num: string;
    privilege_user: boolean;
    established_year: string;
    created_at: string;
    updated_at: string;
    active_status: boolean;
}

export interface BusinessBranchRequest {
    branch_id?: number;
    bid?: number;
    shop_name: string;
    type_id: number;
    location: number;
    state: number;
    b_city_id: number;
    address: string;
    email: string;
    number: string;
    gst_num: string;
    pan_num: string;
    privilege_user: boolean;
    established_year: string;
    active_status: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class BusinessLocationsService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient, private authService: AuthService) { }

    private getAuthHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });
    }

    getAllBusinessesOfUser(): Observable<BusinessLocation[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<BusinessLocation[]>(`${this.apiUrl}/getAllBusinessBranchesByUser`, { headers });
    }

    getAllBusinessesWithNameOfUser(): Observable<BusinessBranchWithNames[]> {
            const headers = this.getAuthHeaders();
            return this.http.get<BusinessBranchWithNames[]>(`${this.apiUrl}/getAllBusinessBranchesWithNamesByUser`, { headers });
        }
}
