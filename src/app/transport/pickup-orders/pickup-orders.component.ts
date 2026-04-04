import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PickupService, ActiveJob, JobOrder } from './pickup.service';

@Component({
  selector: 'app-pickup-orders',
  templateUrl: './pickup-orders.component.html',
  styleUrls: ['./pickup-orders.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, HttpClientModule, TranslatePipe],
})
export class PickupOrdersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  jobs = signal<ActiveJob[]>([]);
  selectedJob: ActiveJob | null = null;
  orders = signal<JobOrder[]>([]);
  selectedOrder: JobOrder | null = null;
  loading = false;
  error = '';
  otpLoading = false;
  otpError = '';
  otpSuccess = '';

  constructor(
    private pickupService: PickupService,
    private translate: TranslateService
  ) {}

  getStatusTitle(status: string): string {
    switch (status) {
      case 'accepted':
        return this.translate.instant('PICKUP_ORDERS.STATUS_ACCEPTED');
      case 'picked_up':
        return this.translate.instant('PICKUP_ORDERS.STATUS_PICKED_UP');
      case 'partially_picked':
        return this.translate.instant('PICKUP_ORDERS.STATUS_PARTIALLY_PICKED');
      default:
        return this.translate.instant('PICKUP_ORDERS.STATUS_UNKNOWN');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    this.fetchJobs();
  }

  fetchJobs() {
    this.loading = true;
    this.error = '';
    this.pickupService.getActiveJobs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: jobs => {
          this.jobs.set(jobs);
          this.loading = false;
        },
        error: err => {
          this.error = this.translate.instant('PICKUP_ORDERS.LOAD_JOBS_ERROR');
          this.loading = false;
        }
      });
  }

  sortedJobs() {
    return this.jobs().slice().sort((a, b) =>
      a.delivery_date.localeCompare(b.delivery_date)
    );
  }

  selectJob(job: ActiveJob) {
    this.selectedJob = job;
    this.selectedOrder = null;
    this.otpError = '';
    this.otpSuccess = '';
    this.error = '';
    this.loading = true;
    this.pickupService.getJobOrders(job.job_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: orders => {
          this.orders.set(orders);
          this.loading = false;
        },
        error: err => {
          this.error = this.translate.instant('PICKUP_ORDERS.LOAD_ORDERS_ERROR');
          this.loading = false;
        }
      });
  }

  sortedOrders() {
    return this.orders().slice().sort((a, b) =>
      a.date_of_order.localeCompare(b.date_of_order)
    );
  }

  selectOrder(order: JobOrder) {
    this.selectedOrder = order;
    this.otpError = '';
    this.otpSuccess = '';
  }

  backToJobs() {
    this.selectedJob = null;
    this.selectedOrder = null;
    this.orders.set([]);
    this.otpError = '';
    this.otpSuccess = '';
  }

  backToOrders() {
    this.selectedOrder = null;
    this.otpError = '';
    this.otpSuccess = '';
  }

  isToday(date: string) {
    const today = new Date().toISOString().slice(0, 10);
    return date.slice(0, 10) === today;
  }

  canVerifyPickup() {
    if (!this.selectedJob || !this.selectedOrder) {
      return false;
    }

    const jobIsToday = this.isToday(this.selectedJob.delivery_date);
    const pickupWindowOpen = ['accepted', 'partially_picked'].includes(this.selectedJob.job_status);
    const orderAlreadyPickedOrDelivered = [5, 8].includes(this.selectedOrder.order_status_id);

    return jobIsToday && pickupWindowOpen && !orderAlreadyPickedOrDelivered;
  }

  verifyOtp(enteredOtp: string) {
    if (!enteredOtp?.trim()) {
      this.otpError = this.translate.instant('PICKUP_ORDERS.ENTER_OTP');
      this.otpSuccess = '';
      return;
    }

    if (enteredOtp.length !== 6 || !/^\d+$/.test(enteredOtp)) {
      this.otpError = this.translate.instant('PICKUP_ORDERS.INVALID_OTP_FORMAT');
      this.otpSuccess = '';
      return;
    }

    if (!this.selectedOrder) return;
    this.otpLoading = true;
    this.otpError = '';
    this.otpSuccess = '';
    this.pickupService.confirmPickup(this.selectedOrder.order_id, enteredOtp)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.otpSuccess = res.message || this.translate.instant('PICKUP_ORDERS.PICKUP_CONFIRMED');
          this.otpError = '';
          this.otpLoading = false;
          this.selectJob(this.selectedJob!);
          this.selectedOrder = null;
        },
        error: err => {
          this.otpError = err.error?.error || this.translate.instant('PICKUP_ORDERS.INVALID_OTP');
          this.otpSuccess = '';
          this.otpLoading = false;
        }
      });
  }
}
