import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  AdminControlTowerSummary,
  FinanceDashboardSummary,
  OpsDashboardSummary,
} from './console-dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class ConsoleDashboardService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAdminControlTowerSummary(): Observable<AdminControlTowerSummary> {
    return this.http.get<AdminControlTowerSummary>(`${this.apiUrl}/admin/control-tower/summary`);
  }

  getOpsDashboardSummary(): Observable<OpsDashboardSummary> {
    return this.http.get<OpsDashboardSummary>(`${this.apiUrl}/admin/ops-dashboard/summary`);
  }

  getFinanceDashboardSummary(): Observable<FinanceDashboardSummary> {
    return this.http.get<FinanceDashboardSummary>(`${this.apiUrl}/admin/finance-dashboard/summary`);
  }
}
