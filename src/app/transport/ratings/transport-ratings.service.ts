import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface PeerRatingEntityRef {
  entity_type: string;
  entity_id: number;
  display_name: string;
  mobile_number?: string;
  job_id?: number;
}

export interface PeerRatingPairOption {
  pair_key: string;
  order_id: number;
  job_id?: number;
  rater_entity_type: string;
  rater_entity_id: number;
  rater_display_name: string;
  ratee_entity_type: string;
  ratee_entity_id: number;
  ratee_display_name: string;
  label: string;
}

export interface PeerRatingOverview {
  available: boolean;
  raw_average_rating: number;
  displayed_average_rating: number;
  rating_count: number;
  last_rated_at?: string;
}

export interface PeerRatingRecentItem {
  rating_id: number;
  order_id: number;
  job_id?: number;
  rater_entity_type: string;
  rater_entity_id: number;
  rater_display_name: string;
  ratee_entity_type: string;
  ratee_entity_id: number;
  ratee_display_name: string;
  stars: number;
  comment?: string;
  captured_by_user_id: number;
  captured_at: string;
}

export interface PeerRatingContextResponse {
  order_id: number;
  order_status_text?: string;
  delivered_at?: string;
  eligible: boolean;
  eligibility_message?: string;
  actor?: PeerRatingEntityRef;
  retailer?: PeerRatingEntityRef;
  wholesalers: PeerRatingEntityRef[];
  drivers: PeerRatingEntityRef[];
  eligible_pairs: PeerRatingPairOption[];
  existing_ratings: PeerRatingRecentItem[];
}

export interface PeerRatingSubmissionRequest {
  order_id: number;
  job_id?: number;
  rater_entity_type: string;
  rater_entity_id: number;
  ratee_entity_type: string;
  ratee_entity_id: number;
  stars: number;
  comment: string;
}

export interface PeerRatingSubmissionResponse {
  rating_id: number;
  message: string;
  ratee_rating: PeerRatingOverview;
}

export interface MyPeerRatingResponse {
  actor: PeerRatingEntityRef;
  received_rating: PeerRatingOverview;
  recent_received: PeerRatingRecentItem[];
  recent_given: PeerRatingRecentItem[];
}

@Injectable({
  providedIn: 'root'
})
export class TransportRatingsService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getRatingContext(orderId: number, jobId?: number): Observable<PeerRatingContextResponse> {
    let params = new HttpParams().set('order_id', String(orderId));
    if (jobId) {
      params = params.set('job_id', String(jobId));
    }

    return this.http.get<PeerRatingContextResponse>(`${this.apiUrl}/ratings/context`, { params }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  submitPeerRating(payload: PeerRatingSubmissionRequest): Observable<PeerRatingSubmissionResponse> {
    return this.http.post<PeerRatingSubmissionResponse>(`${this.apiUrl}/ratings/peer`, payload).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  getMyPeerRating(): Observable<MyPeerRatingResponse> {
    return this.http.get<MyPeerRatingResponse>(`${this.apiUrl}/ratings/me`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse) {
    const message = error.error?.error || error.error?.message || 'Request failed';
    return throwError(() => new Error(message));
  }
}
