import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';

export interface DisputeResolution {
  outcome_code: string;           // refund_approved | refund_rejected | penalty_applied | …
  decision_summary: string;
  liable_party_role?: string;
  disputed_amount?: number;
  approved_amount?: number;
  refund_amount?: number;
  penalty_amount?: number;
  compensation_amount?: number;
  ops_action_required?: string;
  finance_action_required?: string;
  decided_at: string;
  executed_at?: string;
}

export interface Dispute {
  id: string | number;
  case_reference: string;         // DSP-2026-000123
  issue_type_code: string;        // maps to issue_types.code
  title?: string;
  description: string;
  status: string;                 // new | triaged | under_review | … | resolved | closed
  priority: string;               // low | medium | high | critical
  severity?: string;
  source_channel: string;
  issue_classification?: string;
  job_id?: number;
  order_id?: number;
  payment_id?: number;
  driver_id?: number;
  retailer_id?: number;
  incident_at?: string;
  reported_at: string;
  first_response_at?: string;
  resolved_at?: string;
  closed_at?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  next_step_type?: string;
  next_step_due_at?: string;
  resolution?: DisputeResolution; // joined from dispute_resolution
}

export interface DisputeEvidence {
  id: string | number;
  case_id: string | number;
  evidence_type: string;          // photo | video | document | gps_snapshot | …
  file_name?: string;
  mime_type?: string;
  file_url?: string;
  caption?: string;
  capture_source?: string;
  captured_at?: string;
  is_primary: boolean;
  created_at: string;
}

export interface CreateDisputeRequest {
  issue_type_code: string;
  title?: string;
  description: string;
  priority: string;
  source_channel: string;
  job_id?: number;
  order_id?: number;
  payment_id?: number;
  incident_at?: string;
}

@Injectable({ providedIn: 'root' })
export class DisputeService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`,
      'Content-Type': 'application/json',
    });
  }

  getMyDisputes(): Observable<Dispute[]> {
    return this.http.get<Dispute[]>(
      `${this.base}/transportation/disputes`,
      { headers: this.headers() }
    );
  }

  getDispute(id: string | number): Observable<Dispute> {
    return this.http.get<Dispute>(
      `${this.base}/transportation/disputes/${id}`,
      { headers: this.headers() }
    );
  }

  createDispute(payload: CreateDisputeRequest): Observable<Dispute> {
    return this.http.post<Dispute>(
      `${this.base}/transportation/disputes`,
      payload,
      { headers: this.headers() }
    );
  }

  getEvidence(caseId: string | number): Observable<DisputeEvidence[]> {
    return this.http.get<DisputeEvidence[]>(
      `${this.base}/transportation/disputes/${caseId}/evidence`,
      { headers: this.headers() }
    );
  }

  uploadEvidence(caseId: string | number, files: File[]): Observable<DisputeEvidence[]> {
    const form = new FormData();
    files.forEach(f => form.append('files', f, f.name));

    // Don't pass Content-Type header — browser must set multipart boundary itself
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`,
    });
    return this.http.post<DisputeEvidence[]>(
      `${this.base}/transportation/disputes/${caseId}/evidence`,
      form,
      { headers }
    );
  }
}