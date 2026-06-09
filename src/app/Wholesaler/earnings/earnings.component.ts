import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBackOutline,
  calendarOutline,
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
  WholesalerApiService,
  WholesalerEarningsDay,
  WholesalerEarningsOrder,
  WholesalerEarningsOrderDetail,
  WholesalerEarningsQuery,
  WholesalerEarningsSummary
} from '../services/wholesaler-api.service';

type EarningsRange = '7' | '30' | 'all';
type EarningsStatus = NonNullable<WholesalerEarningsQuery['status']>;

@Component({
  selector: 'app-wholesaler-earnings',
  templateUrl: './earnings.component.html',
  styleUrls: ['./earnings.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslatePipe]
})
export class EarningsComponent implements OnInit, OnDestroy {
  summary?: WholesalerEarningsSummary;
  days: WholesalerEarningsDay[] = [];
  orders: WholesalerEarningsOrder[] = [];
  detail?: WholesalerEarningsOrderDetail;

  range: EarningsRange = '30';
  status: EarningsStatus = 'all';
  fromDate = this.formatDate(this.daysAgo(30));
  toDate = this.formatDate(new Date());
  selectedDate = '';

  isLoading = false;
  isLoadingOrders = false;
  isLoadingDetail = false;
  errorMessage = '';
  page = 1;
  pageSize = 20;
  hasMoreOrders = false;

  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastController: ToastController,
    private translate: TranslateService,
    private wholesalerApi: WholesalerApiService
  ) {
    addIcons({
      alertCircleOutline,
      arrowBackOutline,
      calendarOutline,
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
    const orderId = Number(this.route.snapshot.queryParamMap.get('orderId'));
    if (orderId > 0) {
      this.loadOrderDetail(orderId);
    }
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  goBack(): void {
    this.router.navigate(['/wholesaler/home']);
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
      this.fromDate = this.formatDate(this.daysAgo(Number(value)));
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

  selectDay(day: WholesalerEarningsDay): void {
    this.selectedDate = day.date;
    this.detail = undefined;
    this.page = 1;
    this.loadOrders(true);
  }

  loadMoreOrders(): void {
    if (!this.hasMoreOrders || this.isLoadingOrders) {
      return;
    }
    this.page += 1;
    this.loadOrders(false);
  }

  loadOrderDetail(orderId?: number): void {
    if (!orderId) {
      return;
    }
    this.isLoadingDetail = true;
    const subscription = this.wholesalerApi.getWholesalerEarningsOrderDetail(orderId)
      .pipe(finalize(() => this.isLoadingDetail = false))
      .subscribe({
        next: (detail) => {
          this.detail = detail;
          if (detail.order.event_date) {
            this.selectedDate = detail.order.event_date;
          }
        },
        error: () => this.showToast(this.translate.instant('EARNINGS.DETAIL_LOAD_ERROR'), 'danger')
      });
    this.subscriptions.add(subscription);
  }

  closeDetail(): void {
    this.detail = undefined;
  }

  statusColor(order: WholesalerEarningsOrder): string {
    switch (order.settlement_status) {
      case 'released':
        return 'success';
      case 'ready_for_release':
      case 'release_initiated':
        return 'primary';
      case 'hold':
      case 'blocked':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'medium';
    }
  }

  trackDay(_index: number, day: WholesalerEarningsDay): string {
    return day.date;
  }

  trackOrder(_index: number, order: WholesalerEarningsOrder): number {
    return order.allocation_id;
  }

  loadDashboard(done?: () => void): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.selectedDate = '';
    this.orders = [];
    this.page = 1;
    this.hasMoreOrders = false;

    const query = this.buildQuery();
    const subscription = forkJoin({
      summary: this.wholesalerApi.getWholesalerEarningsSummary(query),
      days: this.wholesalerApi.getWholesalerEarningsDays(query)
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
          this.errorMessage = this.translate.instant('EARNINGS.LOAD_ERROR');
        }
      });
    this.subscriptions.add(subscription);
  }

  private loadOrders(reset: boolean): void {
    if (!this.selectedDate) {
      return;
    }

    this.isLoadingOrders = true;
    const query = this.buildQuery({
      date: this.selectedDate,
      page: this.page,
      page_size: this.pageSize
    });
    const subscription = this.wholesalerApi.getWholesalerEarningsOrders(query)
      .pipe(finalize(() => this.isLoadingOrders = false))
      .subscribe({
        next: (response) => {
          this.orders = reset ? response.items : [...this.orders, ...response.items];
          this.hasMoreOrders = response.has_more;
        },
        error: () => this.showToast(this.translate.instant('EARNINGS.ORDERS_LOAD_ERROR'), 'danger')
      });
    this.subscriptions.add(subscription);
  }

  private buildQuery(extra: Record<string, any> = {}): WholesalerEarningsQuery & Record<string, any> {
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
      color,
      duration: 2500,
      position: 'bottom'
    });
    await toast.present();
  }
}
