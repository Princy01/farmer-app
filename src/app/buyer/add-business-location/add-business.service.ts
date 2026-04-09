import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface State {
  id: number;
  state_name: string;
  state_shortname: string;
}

export interface City {
  id: number;
  city_shortname: string;
  city_name: string;
}

export interface Location {
  id: number;
  location_name: string | null;
  city_id: number;
  city_name: string | null;
  state_id: number;
  state_name: string | null;
}

export interface BusinessType {
  b_typeid: number;
  b_typename: string;
  remarks: string;
}

export interface BusinessBranch {
  branch_id: number;
  bid: number;
  shop_name: string;
  type_id: number;
  location: number;
  state: number;
  city_id: number;
  address: string;
  email: string;
  number: string;
  gst_num: string;
  pan_num: string;
  privilege_user: boolean;
  established_year: string;
  active_status: boolean;
  latitude: number;
  longitude: number;
  image: string;
  location_capture_source?: string | null;
  location_verification_status?: string | null;
  location_captured_at?: string | null;
  location_verified_at?: string | null;
  location_verified_by?: number | null;
  location_verification_notes?: string | null;
}

export interface BusinessBranchWithNames extends BusinessBranch {
  state_name?: string;
  city_name?: string;
  location_name?: string;
}

export interface BranchAddressResolutionCandidate {
  location_id: number;
  location_name: string;
  alias_text: string;
  language_code: string;
  script_code: string;
  score: number;
  contains_alias: boolean;
  contains_latin: boolean;
}

export interface BranchAddressResolutionResponse {
  status: 'pending' | 'resolved' | 'suggested' | 'unresolved' | 'manual_override';
  confidence: number;
  resolved_location_id?: number;
  resolved_location_name?: string;
  selected_location_id?: number;
  selected_location_match?: boolean;
  normalized_query: string;
  candidates: BranchAddressResolutionCandidate[];
}

@Injectable({ providedIn: 'root' })
export class AddBusinessService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getStates(): Observable<State[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<State[]>(`${this.apiUrl}/getStates`, { headers });
  }

  getCitiesOfState(stateId: number): Observable<City[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<City[]>(`${this.apiUrl}/getAllCitiesOfState/${stateId}`, { headers });
  }

  getLocationsByCity(cityId: number): Observable<Location[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Location[]>(`${this.apiUrl}/getLocationsByCity/${cityId}`, { headers });
  }

  createBusinessBranch(data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/business-branches`, data, { headers });
  }

  modifyBusinessBranch(data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/branchDetailsUpdate`, data, { headers });
  }

  resolveBusinessBranchAddress(data: {
    address: string;
    city_id: number;
    selected_location_id?: number | null;
  }): Observable<BranchAddressResolutionResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<BranchAddressResolutionResponse>(
      `${this.apiUrl}/business-branches/resolve-address`,
      data,
      { headers }
    );
  }

  getBusinessBranchById(branchId: number): Observable<BusinessBranch> {
    const headers = this.getAuthHeaders();
    return this.http.get<BusinessBranch>(`${this.apiUrl}/business-branches/${branchId}`, { headers });
  }

  getBusinessTypes(): Observable<BusinessType[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<BusinessType[]>(`${this.apiUrl}/getBusinessTypes`, { headers });
  }
}
