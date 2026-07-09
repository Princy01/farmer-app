import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  calendarOutline,
  carOutline,
  cashOutline,
  chevronForwardOutline,
  closeOutline,
  locationOutline,
  timeOutline,
  walletOutline
} from 'ionicons/icons';
import { forkJoin, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import {
  TransportEarningsApiService,
  TransporterEarningsDay,
  TransporterEarningsJob,
  TransporterEarningsJobDetail,
  TransporterEarningsQuery,
  TransporterEarningsSummary
} from '../services/transport-earnings-api.service';

type EarningsRange = '7' | '30' | 'all';
type EarningsStatus = NonNullable<TransporterEarningsQuery['status']>;

@Component({
  selector: 'app-earnings-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslatePipe],
  templateUrl: './earnings-dashboard.component.html',
  styleUrls: ['./earnings-dashboard.component.scss']
})
export class EarningsDashboardComponent implements OnInit, OnDestroy {
  summary?: TransporterEarningsSummary;
  days: TransporterEarningsDay[] = [];
  jobs: TransporterEarningsJob[] = [];
  detail?: TransporterEarningsJobDetail;

  range: EarningsRange = '30';
  status: EarningsStatus = 'all';
  fromDate = this.formatDate(this.startDateForRange(30));
  toDate = this.formatDate(new Date());
  selectedDate = '';

  isLoading = false;
  isLoadingJobs = false;
  isLoadingDetail = false;
  errorMessage = '';
  page = 1;
  pageSize = 10;
  hasPreviousJobs = false;
  hasNextJobs = false;

  private subscriptions = new Subscription();

  constructor(
    private toastController: ToastController,
    private translate: TranslateService,
    private earningsApi: TransportEarningsApiService
  ) {
    addIcons({
      alertCircleOutline,
      calendarOutline,
      carOutline,
      cashOutline,
      chevronForwardOutline,
      closeOutline,
      locationOutline,
      timeOutline,
      walletOutline
    });
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  handleRefresh(event: any): void {
    this.loadDashboard(() => event?.target?.complete());
  }

  changeRange(value: EarningsRange): void {
    this.range = value;
    if (value === 'all') {
      this.fromDate = '';
      this.toDate = '';
    } else {
      this.fromDate = this.formatDate(this.startDateForRange(Number(value)));
      this.toDate = this.formatDate(new Date());
    }
    this.detail = undefined;
    this.loadDashboard();
  }

  changeStatus(value: EarningsStatus): void {
    this.status = value || 'all';
    this.detail = undefined;
    this.loadDashboard();
  }

  selectDay(day: TransporterEarningsDay): void {
    this.selectedDate = day.date;
    this.detail = undefined;
    this.page = 1;
    this.loadJobs();
  }

  previousJobsPage(): void {
    if (!this.hasPreviousJobs || this.isLoadingJobs) {
      return;
    }
    this.page -= 1;
    this.loadJobs();
  }

  nextJobsPage(): void {
    if (!this.hasNextJobs || this.isLoadingJobs) {
      return;
    }
    this.page += 1;
    this.loadJobs();
  }

  loadJobDetail(jobId?: number): void {
    if (!jobId) {
      return;
    }
    this.isLoadingDetail = true;
    const subscription = this.earningsApi.getJobDetail(jobId)
      .pipe(finalize(() => this.isLoadingDetail = false))
      .subscribe({
        next: (detail) => {
          this.detail = detail;
          if (detail.job.event_date) {
            this.selectedDate = detail.job.event_date;
          }
        },
        error: () => {
          this.detail = undefined;
        }
      });
    this.subscriptions.add(subscription);
  }

  closeDetail(): void {
    this.detail = undefined;
  }

  statusColor(job: TransporterEarningsJob): string {
    switch (job.settlement_status) {
      case 'released':
        return 'success';
      case 'ready_for_release':
      case 'release_initiated':
        return 'primary';
      case 'hold':
      case 'blocked':
      case 'pending_finance_link':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'medium';
    }
  }

  trackDay(_index: number, day: TransporterEarningsDay): string {
    return day.date;
  }

  trackJob(_index: number, job: TransporterEarningsJob): number {
    return job.job_id;
  }

  loadDashboard(done?: () => void): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.selectedDate = '';
    this.jobs = [];
    this.page = 1;
    this.hasPreviousJobs = false;
    this.hasNextJobs = false;

    const query = this.buildQuery();
    const subscription = forkJoin({
      summary: this.earningsApi.getSummary(query),
      days: this.earningsApi.getDays(query)
    })
      .pipe(finalize(() => {
        this.isLoading = false;
        done?.();
      }))
      .subscribe({
        next: ({ summary, days }) => {
          this.summary = summary;
          this.days = days;
          if (!this.detail && days.length > 0) {
            this.selectDay(days[0]);
          }
        },
        error: () => {
          this.errorMessage = this.translate.instant('TRANSPORT_EARNINGS.LOAD_ERROR');
        }
      });
    this.subscriptions.add(subscription);
  }

  private loadJobs(): void {
    if (!this.selectedDate) {
      return;
    }

    this.isLoadingJobs = true;
    const query = this.buildQuery({
      date: this.selectedDate,
      page: this.page,
      page_size: this.pageSize
    });
    const subscription = this.earningsApi.getJobs(query)
      .pipe(finalize(() => this.isLoadingJobs = false))
      .subscribe({
        next: (response) => {
          this.jobs = response.items.filter(job => this.isSuccessfullyCompleted(job));
          this.hasPreviousJobs = this.page > 1;
          this.hasNextJobs = response.has_more;
        },
        error: () => this.showToast(this.translate.instant('TRANSPORT_EARNINGS.JOBS_LOAD_ERROR'), 'danger')
      });
    this.subscriptions.add(subscription);
  }

  private buildQuery(extra: Record<string, any> = {}): TransporterEarningsQuery & Record<string, any> {
    return {
      from: this.fromDate || undefined,
      to: this.toDate || undefined,
      status: this.status,
      job_status: 'completed',
      ...extra
    };
  }

  private isSuccessfullyCompleted(job: TransporterEarningsJob): boolean {
    const statuses = [
      job.job_status,
      job.transport_status,
      job.delivery_status
    ]
      .map(status => (status || '').toLowerCase().trim())
      .filter(Boolean);

    if (statuses.some(status => this.hasAnyStatusToken(status, [
      'cancel',
      'reject',
      'fail',
      'abort',
      'return'
    ]))) {
      return false;
    }

    return statuses.some(status => this.hasAnyStatusToken(status, [
      'completed',
      'delivered',
      'delivery_confirmed',
      'delivery confirmed',
      'success'
    ])) || Boolean(job.delivered_at?.trim());
  }

  private hasAnyStatusToken(status: string, tokens: string[]): boolean {
    return tokens.some(token => status.includes(token));
  }

  private startDateForRange(daysBack: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - Math.max(daysBack - 1, 0));
    return date;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}
