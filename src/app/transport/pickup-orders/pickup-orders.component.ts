import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';
import { PickupService, ActiveJob, JobOrder } from './pickup.service';

@Component({
  selector: 'app-pickup-orders',
  templateUrl: './pickup-orders.component.html',
  styleUrls: ['./pickup-orders.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, HttpClientModule],
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

  constructor(private pickupService: PickupService) { }

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
        this.error = 'Failed to load jobs';
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
        this.error = 'Failed to load orders';
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
      this.otpError = 'Please enter OTP';
      this.otpSuccess = '';
      return;
    }
    if (!this.selectedOrder) return;
    this.otpLoading = true;
    this.pickupService.confirmPickup(this.selectedOrder.order_id, enteredOtp).subscribe({
      next: res => {
        this.otpSuccess = res.message || 'Pickup confirmed!';
        this.otpError = '';
        this.otpLoading = false;
        // Optionally refresh order status here
        this.selectJob(this.selectedJob!);
        this.selectedOrder = null;
      },
      error: err => {
        this.otpError = err.error?.error || 'Invalid OTP. Please try again.';
        this.otpSuccess = '';
        this.otpLoading = false;
      }
    });
  }
}