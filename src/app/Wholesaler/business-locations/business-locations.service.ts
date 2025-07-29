import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface BusinessLocation {
        b_branch_id: number;
        bid: number;
        b_shop_name: string;
        b_type_id: number;
        b_location: number;
        b_state: number;
        b_address: string;
        b_email: string;
        b_number: string;
        b_gst_num: string;
        b_pan_num: string;
        b_privilege_user: number;
        b_established_year: string;
        active_status: number;
}

@Injectable({
        providedIn: 'root'
})
export class BusinessLocationsService {
        private apiUrl = environment.apiUrl;

        constructor(private http: HttpClient, private authService: AuthService
        ) { }

        private getAuthHeaders(): HttpHeaders {
                const token = this.authService.getToken();
                return new HttpHeaders({
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                });
        }

        getAllBusinessesOfWholesaler(): Observable<BusinessLocation[]> {
                const headers = this.getAuthHeaders();
                return this.http.get<BusinessLocation[]>(`${this.apiUrl}/getAllBusinessBranchesByWholeSaler`, { headers });
        }
}