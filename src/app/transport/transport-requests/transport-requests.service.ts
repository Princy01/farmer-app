import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface TransportRequest {
  job_id: number;
  id: string;
  pickup_location: string;
  dropoff_location: string;
  weight: number;
  distance: number;
  delivery_type: string;
  delivery_date: string;
  base_price: number;
  urgency: string;
  requested_date: string;
  load_type: string;
}

export interface AcceptJobRequest {
  job_id: number;
  vehicle_id: number;
}

export interface RejectJobRequest {
  job_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransportRequestService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getTransportRequests(cityIds?: number[], branchIds?: number[]): Observable<{delivery_requests: TransportRequest[]}> {
    const headers = this.getAuthHeaders();
    let url = `${this.apiUrl}/requests/transport-requests`;

    const params = [];
    if (cityIds && cityIds.length > 0) {
      params.push(`city_ids=${cityIds.join(',')}`);
    }
    if (branchIds && branchIds.length > 0) {
      params.push(`branch_ids=${branchIds.join(',')}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http.get<{delivery_requests: TransportRequest[]}>(url, { headers });
  }

  acceptTransportRequest(jobId: number, vehicleId: number): Observable<{message: string}> {
    const headers = this.getAuthHeaders();
    const body: AcceptJobRequest = {
      job_id: jobId,
      vehicle_id: vehicleId
    };

    return this.http.post<{message: string}>(`${this.apiUrl}/requests/accept-transport-request`, body, { headers });
  }

  rejectTransportRequest(jobId: number): Observable<{message: string}> {
    const headers = this.getAuthHeaders();
    const body: RejectJobRequest = {
      job_id: jobId
    };

    return this.http.post<{message: string}>(`${this.apiUrl}/requests/reject-transport-request`, body, { headers });
  }
}