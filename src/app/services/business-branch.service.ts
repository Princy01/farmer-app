import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BusinessBranch {
  b_branch_id?: number;
  bid: number;
  b_shop_name: string;
  b_type_id: number;
  b_location: number;
  b_state: number;
  b_mandi_id?: number;
  b_address: string;
  b_email: string;
  b_number: string;
  b_gst_num?: string;
  b_pan_num?: string;
  b_privilege_user: number;
  b_established_year: string;
  active_status: number;
}

@Injectable({
  providedIn: 'root'
})
export class BusinessBranchService {
  private apiUrl = 'http://127.0.0.1:3000';  // Go Fiber backend URL

  constructor(private http: HttpClient) {}

  getAllBusinessBranches(): Observable<BusinessBranch[]> {
    return this.http.get<BusinessBranch[]>(`${this.apiUrl}/getBusinessBranches`);
  }

  getBusinessBranchById(id: number): Observable<BusinessBranch> {
    return this.http.get<BusinessBranch>(`${this.apiUrl}/getBusinessesbranch/${id}`);
  }

  insertBusinessBranch(branch: BusinessBranch): Observable<{ message: string; b_branch_id: number }> {
    return this.http.post<{ message: string; b_branch_id: number }>(`${this.apiUrl}/business-branches`, branch);
  }

  updateBusinessBranch(id: number, branch: BusinessBranch): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/branch/${id}`, branch);
  }
}
