import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PickupService, ActiveJob, JobOrder } from './pickup.service';

@Component({
  selector: 'app-pickup-orders',
  templateUrl: './pickup-orders.component.html',
  styleUrls: ['./pickup-orders.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, HttpClientModule, TranslatePipe],
})
export class PickupOrdersComponent implements OnInit {
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
  ) { }

  ngOnInit() {
    this.fetchJobs();
  }

  fetchJobs() {
    this.loading = true;
    this.pickupService.getActiveJobs().subscribe({
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
    this.loading = true;
    this.pickupService.getJobOrders(job.job_id).subscribe({
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

  verifyOtp(enteredOtp: string) {
    if (!enteredOtp) {
      this.otpError = this.translate.instant('PICKUP_ORDERS.ENTER_OTP');
      this.otpSuccess = '';
      return;
    }
    if (!this.selectedOrder) return;
    this.otpLoading = true;
    this.pickupService.confirmPickup(this.selectedOrder.order_id, enteredOtp).subscribe({
      next: res => {
        this.otpSuccess = res.message || this.translate.instant('PICKUP_ORDERS.PICKUP_CONFIRMED');
        this.otpError = '';
        this.otpLoading = false;
        // Optionally refresh order status here
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