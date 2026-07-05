import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  cubeOutline,
  calendarOutline,
  cashOutline,
  locationOutline,
  closeCircleOutline,
  checkmarkDoneCircle,
  keyOutline,
  timeOutline,
  alertCircleOutline,
  closeOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import { PickupService, ActiveJob, JobOrder, PickupOTP } from './pickup.service';

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

  // The order the OTP sheet is currently showing. Kept separate from "page
  // navigation" — opening it no longer means leaving the order list.
  selectedOrder: JobOrder | null = null;
  isOtpSheetOpen = false;

  loading = false;
  error = '';
  isCancellingJob = false;

  // The driver only ever *reads* this code aloud to the wholesaler — the
  // wholesaler is the one who enters/confirms it in their own app. So this
  // screen has no manual-entry field and no "confirm" action of its own.
  pickupOtp: PickupOTP | null = null;
  otpFetchLoading = false;
  otpFetchError = '';
  otpRemainingSeconds = 0;
  private otpCountdownHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    private pickupService: PickupService,
    private translate: TranslateService,
    private alertCtrl: AlertController
  ) {
    addIcons({
      arrowBack,
      cubeOutline,
      calendarOutline,
      cashOutline,
      locationOutline,
      closeCircleOutline,
      checkmarkDoneCircle,
      keyOutline,
      timeOutline,
      alertCircleOutline,
      closeOutline,
      chevronForwardOutline
    });
  }

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

  getStatusColor(status: string): string {
    switch (status) {
      case 'accepted':
        return 'primary';
      case 'picked_up':
        return 'success';
      case 'partially_picked':
        return 'warning';
      default:
        return 'medium';
    }
  }

  getOrderStatusColor(order: JobOrder): string {
    return [5, 8].includes(order.order_status_id) ? 'success' : 'medium';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearOtpCountdown();
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

  // ===== OTP bottom sheet =====
  // Tapping an order opens the sheet directly and immediately kicks off the
  // OTP fetch (when eligible), so the driver sees a code with a single tap
  // on the order — no separate "details" page and no separate "Get OTP" tap.
  openOrderSheet(order: JobOrder): void {
    this.selectedOrder = order;
    this.pickupOtp = null;
    this.otpFetchError = '';
    this.clearOtpCountdown();
    this.isOtpSheetOpen = true;

    if (this.canViewOtp()) {
      this.fetchPickupOtp();
    }
  }

  closeOtpSheet(): void {
    this.isOtpSheetOpen = false;
    this.selectedOrder = null;
    this.pickupOtp = null;
    this.otpFetchError = '';
    this.clearOtpCountdown();

    // The wholesaler confirms the pickup on their own app, possibly while
    // this sheet was open, so refresh the order list on close to pick up
    // any status change (e.g. "Order Created" -> "Picked Up").
    if (this.selectedJob) {
      this.selectJob(this.selectedJob);
    }
  }

  backToJobs() {
    if (this.isOtpSheetOpen) {
      this.isOtpSheetOpen = false;
      this.selectedOrder = null;
      this.pickupOtp = null;
      this.otpFetchError = '';
      this.clearOtpCountdown();
    }
    this.selectedJob = null;
    this.orders.set([]);
    this.error = '';
  }

  async promptCancelJob(): Promise<void> {
    if (!this.selectedJob || this.isCancellingJob) {
      return;
    }

    const jobId = this.selectedJob.job_id;
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PICKUP_ORDERS.CANCEL_JOB_TITLE'),
      message: this.translate.instant('PICKUP_ORDERS.CANCEL_JOB_MESSAGE', { jobId }),
      buttons: [
        {
          text: this.translate.instant('PICKUP_ORDERS.CANCEL_JOB_ABORT'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('PICKUP_ORDERS.CANCEL_JOB_ACTION'),
          handler: () => this.cancelJob(jobId)
        }
      ]
    });

    await alert.present();
  }

  private cancelJob(jobId: number): void {
    this.isCancellingJob = true;
    this.pickupService.cancelJob(jobId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          this.isCancellingJob = false;
          await this.showCancelSuccess();
          this.backToJobs();
          this.fetchJobs();
        },
        error: async () => {
          this.isCancellingJob = false;
          await this.showCancelError();
        }
      });
  }

  private async showCancelSuccess(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PICKUP_ORDERS.CANCEL_JOB_SUCCESS_TITLE'),
      message: this.translate.instant('PICKUP_ORDERS.CANCEL_JOB_SUCCESS_MESSAGE'),
      buttons: [this.translate.instant('PICKUP_ORDERS.OK')]
    });
    await alert.present();
  }

  private async showCancelError(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PICKUP_ORDERS.CANCEL_JOB_ERROR_TITLE'),
      message: this.translate.instant('PICKUP_ORDERS.CANCEL_JOB_ERROR_MESSAGE'),
      buttons: [this.translate.instant('PICKUP_ORDERS.OK')]
    });
    await alert.present();
  }

  // Viewing/fetching the OTP is a harmless read. Only exclude orders that
  // are already picked up or delivered — there's nothing to show for those.
  canViewOtp(): boolean {
    if (!this.selectedOrder) {
      return false;
    }
    return ![5, 8].includes(this.selectedOrder.order_status_id);
  }

  fetchPickupOtp(): void {
    if (!this.selectedOrder || this.otpFetchLoading) {
      return;
    }
    this.otpFetchLoading = true;
    this.otpFetchError = '';
    this.clearOtpCountdown();
    this.pickupService.getActivePickupOTP(this.selectedOrder.order_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: otp => {
          this.pickupOtp = otp;
          this.otpFetchLoading = false;
          this.startOtpCountdown(otp.expires_at);
        },
        error: err => {
          this.pickupOtp = null;
          this.otpFetchError = err.error?.error || this.translate.instant('PICKUP_ORDERS.GET_OTP_ERROR');
          this.otpFetchLoading = false;
        }
      });
  }

  formatCountdown(): string {
    const minutes = Math.floor(this.otpRemainingSeconds / 60);
    const seconds = this.otpRemainingSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private startOtpCountdown(expiresAt: string): void {
    const tick = () => {
      const remainingMs = new Date(expiresAt).getTime() - Date.now();
      this.otpRemainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
      if (this.otpRemainingSeconds <= 0) {
        this.clearOtpCountdown();
      }
    };
    tick();
    this.otpCountdownHandle = setInterval(tick, 1000);
  }

  private clearOtpCountdown(): void {
    if (this.otpCountdownHandle) {
      clearInterval(this.otpCountdownHandle);
      this.otpCountdownHandle = null;
    }
    this.otpRemainingSeconds = 0;
  }
}