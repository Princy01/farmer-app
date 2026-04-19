import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, timer, TimeoutError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface IssueType {
  id: number;
  code: string;
  name: string;
  description?: string;
  module: string;
  default_priority: string;
  default_severity: string;
  default_owner_role: string;
  first_response_sla_minutes: number;
  resolution_sla_minutes: number;
  is_active: boolean;
}

export interface IssueTypesResponse {
  items: IssueType[];
}

export interface CreateDisputePayload {
  issue_type_id: number;
  title?: string;
  description: string;
  source_channel: 'app';
  order_id: number;
  counterparty_user_id?: number;
  counterparty_role?: string;
}

export interface CreateDisputeResponse {
  case_id: number;
  case_reference: string;
  status: string;
  message: string;
}

export interface DisputeListItem {
  case_id: number;
  case_reference: string;
  issue_type_id: number;
  issue_type_name: string;
  title?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  order_id?: number;
  job_id?: number;
  payment_id?: number;
  shipment_id?: number;
  next_step_type?: string;
  next_step_due_at?: string;
}

export interface ListDisputesResponse {
  items: DisputeListItem[];
  page: number;
  page_size: number;
}

export interface DisputeDetail {
  case_id: number;
  case_reference: string;
  issue_type_id: number;
  issue_type_name: string;
  title?: string;
  description: string;
  status: string;
  priority: string;
  severity: string;
  source_channel: string;
  raised_by_user_id?: number;
  raised_by_role: string;
  current_assignee_user_id?: number;
  current_assignee_role: string;
  order_id?: number;
  job_id?: number;
  payment_id?: number;
  shipment_id?: number;
  next_step_type?: string;
  next_step_due_at?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
}

export interface DisputeAction {
  action_id: number;
  action_type: string;
  performed_by_user_id?: number;
  performed_by_role: string;
  status_from?: string;
  status_to?: string;
  note?: string;
  created_at: string;
}

export interface DisputeActionsResponse {
  items: DisputeAction[];
}

export interface DisputeEvidence {
  evidence_id: number;
  case_id: number;
  evidence_type: string;
  file_name?: string;
  mime_type?: string;
  file_url?: string;
  caption?: string;
  capture_source?: string;
  captured_latitude?: number;
  captured_longitude?: number;
  captured_at?: string;
  uploaded_by_user_id?: number;
  uploaded_by_role: string;
  created_at: string;
}

export interface DisputeEvidenceResponse {
  items: DisputeEvidence[];
}

export interface AddEvidencePayload {
  image: File;
  caption: string;
  capture_source: 'camera';
  captured_at: string;
  captured_latitude?: number;
  captured_longitude?: number;
}

export interface AddEvidenceResponse {
  evidence_id: number;
  file_url: string;
  message: string;
}

export interface DuplicateDisputeCase {
  case_id: number;
  case_reference: string;
  status: string;
}

export interface BuyerDisputesApiError extends Error {
  translationKey: string;
  apiMessage?: string;
  statusCode?: number;
  errorCode?: string;
  existingCase?: DuplicateDisputeCase;
}

@Injectable({
  providedIn: 'root',
})
export class BuyerDisputesService {
  private readonly apiUrl = environment.apiUrl;
  private readonly HTTP_TIMEOUT_MS = 30000;

  constructor(private http: HttpClient) {}

  getIssueTypes(): Observable<IssueTypesResponse> {
    const params = new HttpParams().set('is_active', 'true');
    return this.readonlyRequest(
      this.http.get<IssueTypesResponse>(`${this.apiUrl}/issue-types`, { params })
    );
  }

  createDispute(payload: CreateDisputePayload): Observable<CreateDisputeResponse> {
    return this.mutationRequest(
      this.http.post<CreateDisputeResponse>(`${this.apiUrl}/disputes`, payload)
    );
  }

  getMyDisputes(page: number = 1, pageSize: number = 20, orderId?: number): Observable<ListDisputesResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (orderId && orderId > 0) {
      params = params.set('order_id', orderId.toString());
    }

    return this.readonlyRequest(
      this.http.get<ListDisputesResponse>(`${this.apiUrl}/disputes`, { params })
    );
  }

  getDisputeById(disputeId: number): Observable<DisputeDetail> {
    return this.readonlyRequest(
      this.http.get<DisputeDetail>(`${this.apiUrl}/disputes/${disputeId}`)
    );
  }

  getDisputeActions(disputeId: number): Observable<DisputeActionsResponse> {
    return this.readonlyRequest(
      this.http.get<DisputeActionsResponse>(`${this.apiUrl}/disputes/${disputeId}/actions`)
    );
  }

  getDisputeEvidence(disputeId: number): Observable<DisputeEvidenceResponse> {
    return this.readonlyRequest(
      this.http.get<DisputeEvidenceResponse>(`${this.apiUrl}/disputes/${disputeId}/evidence`)
    );
  }

  addEvidence(disputeId: number, payload: AddEvidencePayload): Observable<AddEvidenceResponse> {
    const formData = new FormData();
    formData.append('image', payload.image, payload.image.name);
    formData.append('caption', payload.caption || '');
    formData.append('capture_source', payload.capture_source);
    formData.append('captured_at', payload.captured_at);

    if (
      typeof payload.captured_latitude === 'number' &&
      typeof payload.captured_longitude === 'number'
    ) {
      formData.append('captured_latitude', payload.captured_latitude.toString());
      formData.append('captured_longitude', payload.captured_longitude.toString());
    }

    return this.mutationRequest(
      this.http.post<AddEvidenceResponse>(`${this.apiUrl}/disputes/${disputeId}/evidence`, formData)
    );
  }

  replaceEvidence(disputeId: number, evidenceId: number, payload: AddEvidencePayload): Observable<AddEvidenceResponse> {
    const formData = new FormData();
    formData.append('image', payload.image, payload.image.name);
    formData.append('caption', payload.caption || '');
    formData.append('capture_source', payload.capture_source);
    formData.append('captured_at', payload.captured_at);

    if (
      typeof payload.captured_latitude === 'number' &&
      typeof payload.captured_longitude === 'number'
    ) {
      formData.append('captured_latitude', payload.captured_latitude.toString());
      formData.append('captured_longitude', payload.captured_longitude.toString());
    }

    return this.mutationRequest(
      this.http.put<AddEvidenceResponse>(
        `${this.apiUrl}/disputes/${disputeId}/evidence/${evidenceId}`,
        formData
      )
    );
  }

  getEvidenceFile(disputeId: number, evidenceId: number): Observable<Blob> {
    const params = new HttpParams().set('_ts', Date.now().toString());

    return this.readonlyRequest(
      this.http.get(`${this.apiUrl}/disputes/${disputeId}/evidence/${evidenceId}/file`, {
        params,
        responseType: 'blob',
      })
    );
  }

  private readonlyRequest<T>(request: Observable<T>): Observable<T> {
    return request.pipe(
      timeout(this.HTTP_TIMEOUT_MS),
      retry({
        count: 3,
        delay: (_error, retryCount) => timer(Math.pow(2, retryCount - 1) * 1000),
      }),
      catchError((error: HttpErrorResponse | TimeoutError) => this.handleError(error))
    );
  }

  private mutationRequest<T>(request: Observable<T>): Observable<T> {
    return request.pipe(
      timeout(this.HTTP_TIMEOUT_MS),
      catchError((error: HttpErrorResponse | TimeoutError) => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse | TimeoutError): Observable<never> {
    const apiError = new Error('BUYER_DISPUTES.ERROR_GENERIC') as BuyerDisputesApiError;
    apiError.translationKey = 'BUYER_DISPUTES.ERROR_GENERIC';

    if (error instanceof TimeoutError) {
      apiError.translationKey = 'REQUEST_TIMEOUT_ERROR';
      return throwError(() => apiError);
    }

    if (error instanceof HttpErrorResponse) {
      apiError.statusCode = error.status;
      const backendMessage = this.extractBackendMessage(error.error);
      const backendErrorCode = this.extractBackendErrorCode(error.error);
      const existingCase = this.extractExistingCase(error.error);
      apiError.apiMessage = backendMessage;
      apiError.errorCode = backendErrorCode;
      apiError.existingCase = existingCase;

      switch (error.status) {
        case 0:
          apiError.translationKey = 'NETWORK_ERROR';
          break;
        case 400:
          apiError.translationKey = 'BUYER_DISPUTES.ERROR_VALIDATION';
          break;
        case 409:
          apiError.translationKey =
            backendErrorCode === 'duplicate_dispute'
              ? 'BUYER_DISPUTES.ERROR_DUPLICATE_OPEN_DISPUTE'
              : 'BUYER_DISPUTES.ERROR_VALIDATION';
          break;
        case 401:
          apiError.translationKey = 'SESSION_EXPIRED';
          break;
        case 403:
          apiError.translationKey = 'ACCESS_DENIED';
          break;
        case 404:
          apiError.translationKey = 'NOT_FOUND';
          break;
        default:
          if (error.status >= 500) {
            apiError.translationKey = 'SERVER_ERROR';
          }
          break;
      }
    }

    return throwError(() => apiError);
  }

  private extractBackendMessage(errorBody: unknown): string | undefined {
    if (!errorBody || typeof errorBody !== 'object') {
      return undefined;
    }

    const body = errorBody as { message?: unknown };
    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message;
    }

    return undefined;
  }

  private extractBackendErrorCode(errorBody: unknown): string | undefined {
    if (!errorBody || typeof errorBody !== 'object') {
      return undefined;
    }

    const body = errorBody as {
      error?: unknown;
      error_code?: unknown;
      code?: unknown;
    };

    if (typeof body.error === 'string' && body.error.trim()) {
      return body.error;
    }

    if (typeof body.error_code === 'string' && body.error_code.trim()) {
      return body.error_code;
    }

    if (typeof body.code === 'string' && body.code.trim()) {
      return body.code;
    }

    return undefined;
  }

  private extractExistingCase(errorBody: unknown): DuplicateDisputeCase | undefined {
    if (!errorBody || typeof errorBody !== 'object') {
      return undefined;
    }

    const body = errorBody as {
      existing_case?: unknown;
      existingCase?: unknown;
    };

    const nestedCase = this.parseExistingCasePayload(body.existing_case ?? body.existingCase);
    if (nestedCase) {
      return nestedCase;
    }

    return this.parseExistingCasePayload(errorBody);
  }

  private parseExistingCasePayload(casePayload: unknown): DuplicateDisputeCase | undefined {
    if (!casePayload || typeof casePayload !== 'object') {
      return undefined;
    }

    const caseData = casePayload as {
      case_id?: unknown;
      caseId?: unknown;
      case_reference?: unknown;
      caseReference?: unknown;
      status?: unknown;
    };

    const rawCaseId = caseData.case_id ?? caseData.caseId;
    const caseId =
      typeof rawCaseId === 'number'
        ? rawCaseId
        : typeof rawCaseId === 'string' && rawCaseId.trim() && !Number.isNaN(Number(rawCaseId))
          ? Number(rawCaseId)
          : null;

    const caseReference = caseData.case_reference ?? caseData.caseReference;
    const status = caseData.status;

    if (caseId === null || typeof caseReference !== 'string' || typeof status !== 'string') {
      return undefined;
    }

    if (!caseReference.trim() || !status.trim()) {
      return undefined;
    }

    return {
      case_id: caseId,
      case_reference: caseReference,
      status,
    };
  }
}
