import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBackOutline,
  calendarOutline,
  cardOutline,
  cashOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
  closeOutline,
  receiptOutline,
  refreshOutline,
  timeOutline,
  walletOutline
} from 'ionicons/icons';
import { forkJoin, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import {
  BuyerApiService,
  RetailerSpendsDay,
  RetailerSpendsPayment,
  RetailerSpendsPaymentDetail,
  RetailerSpendsQuery,
  RetailerSpendsSummary
} from '../services/buyer-api.service';

type SpendsRange = '7' | '30' | 'all';
type SpendsStatus = NonNullable<RetailerSpendsQuery['status']>;

@Component({
  selector: 'app-retailer-spends',
  templateUrl: './spends.component.html',
  styleUrls: ['./spends.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslatePipe]
})
export class SpendsComponent implements OnInit, OnDestroy {
  summary?: RetailerSpendsSummary;
  days: RetailerSpendsDay[] = [];
  payments: RetailerSpendsPayment[] = [];
  detail?: RetailerSpendsPaymentDetail;

  range: SpendsRange = '30';
  status: SpendsStatus = 'all';
  fromDate = this.formatDate(this.daysAgo(30));
  toDate = this.formatDate(new Date());
  selectedDate = '';

  isLoading = false;
  isLoadingPayments = false;
  isLoadingDetail = false;
  errorMessage = '';
  page = 1;
  pageSize = 20;
  hasMorePayments = false;

  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private toastController: ToastController,
    private translate: TranslateService,
    private buyerApi: BuyerApiService
  ) {
    addIcons({
      alertCircleOutline,
      arrowBackOutline,
      calendarOutline,
      cardOutline,
      cashOutline,
      checkmarkCircleOutline,
      chevronForwardOutline,
      closeOutline,
      receiptOutline,
      refreshOutline,
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

  goBack(): void {
    this.router.navigate(['/buyer/buyer-home']);
  }

  handleRefresh(event: any): void {
    this.loadDashboard(() => event?.target?.complete());
  }

  changeRange(value: SpendsRange): void {
    this.range = value;
    if (value === 'all') {
      this.fromDate = '';
      this.toDate = '';
    } else {
      this.fromDate = this.formatDate(this.daysAgo(Number(value)));
      this.toDate = this.formatDate(new Date());
    }
    this.detail = undefined;
    this.loadDashboard();
  }

  changeStatus(value: SpendsStatus): void {
    this.status = value || 'all';
    this.detail = undefined;
    this.loadDashboard();
  }

  selectDay(day: RetailerSpendsDay): void {
    this.selectedDate = day.date;
    this.detail = undefined;
    this.page = 1;
    this.loadPayments(true);
  }

  loadMorePayments(): void {
    if (!this.hasMorePayments || this.isLoadingPayments) {
      return;
    }
    this.page += 1;
    this.loadPayments(false);
  }

  loadPaymentDetail(payment: RetailerSpendsPayment): void {
    const orderId = payment.order_ids?.[0];
    if (!orderId) {
      this.showToast(this.translate.instant('SPENDS.NO_ORDER_LINK'), 'warning');
      return;
    }

    this.isLoadingDetail = true;
    const subscription = this.buyerApi.getRetailerSpendsPaymentDetail(orderId)
      .pipe(finalize(() => this.isLoadingDetail = false))
      .subscribe({
        next: (detail) => {
          this.detail = detail;
          if (detail.payment.event_date) {
            this.selectedDate = detail.payment.event_date;
          }
        },
        error: () => this.showToast(this.translate.instant('SPENDS.DETAIL_LOAD_ERROR'), 'danger')
      });
    this.subscriptions.add(subscription);
  }

  closeDetail(): void {
    this.detail = undefined;
  }

  statusColor(payment: RetailerSpendsPayment): string {
    switch (payment.status) {
      case 'captured':
      case 'paid':
      case 'success':
        return 'success';
      case 'pending':
      case 'initiated':
        return 'primary';
      case 'failed':
      case 'expired':
        return 'danger';
      case 'cancelled':
        return 'medium';
      case 'refunded':
      case 'partially_refunded':
        return 'tertiary';
      default:
        return 'medium';
    }
  }

  trackDay(_index: number, day: RetailerSpendsDay): string {
    return day.date;
  }

  trackPayment(_index: number, payment: RetailerSpendsPayment): number {
    return payment.payment_intent_id;
  }

  loadDashboard(done?: () => void): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.selectedDate = '';
    this.payments = [];
    this.page = 1;
    this.hasMorePayments = false;

    const query = this.buildQuery();
    const subscription = forkJoin({
      summary: this.buyerApi.getRetailerSpendsSummary(query),
      days: this.buyerApi.getRetailerSpendsDays(query)
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
          this.errorMessage = this.translate.instant('SPENDS.LOAD_ERROR');
        }
      });
    this.subscriptions.add(subscription);
  }

  private loadPayments(reset: boolean): void {
    if (!this.selectedDate) {
      return;
    }

    this.isLoadingPayments = true;
    const query = this.buildQuery({
      date: this.selectedDate,
      page: this.page,
      page_size: this.pageSize
    });
    const subscription = this.buyerApi.getRetailerSpendsPayments(query)
      .pipe(finalize(() => this.isLoadingPayments = false))
      .subscribe({
        next: (response) => {
          this.payments = reset ? response.items : [...this.payments, ...response.items];
          this.hasMorePayments = response.has_more;
        },
        error: () => this.showToast(this.translate.instant('SPENDS.PAYMENTS_LOAD_ERROR'), 'danger')
      });
    this.subscriptions.add(subscription);
  }

  private buildQuery(extra: Record<string, any> = {}): RetailerSpendsQuery & Record<string, any> {
    return {
      from: this.fromDate || undefined,
      to: this.toDate || undefined,
      status: this.status,
      ...extra
    };
  }

  private daysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
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
