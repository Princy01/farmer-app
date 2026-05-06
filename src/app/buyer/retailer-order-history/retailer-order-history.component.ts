import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  locationOutline,
  basketOutline,
  storefrontOutline,
  checkmarkCircle,
  timeOutline,
  checkmarkCircleOutline,
  cubeOutline,
  airplaneOutline,
  carOutline,
  bicycleOutline,
  checkmarkDoneCircle,
  closeCircleOutline,
  helpOutline,
  cardOutline,
  arrowUndoOutline,
} from 'ionicons/icons';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Subject, Subscription, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RetailerOrderHistoryService, RetailerOrderHistory, RetailerCheckoutSessionSummary } from './retailer-order-history.service';
interface DisplayOrder {
  orderId: string;
  rawOrderId: number;
  placedAt: string;
  statusId: number | null;
  statusName: string;
  statusLabel: string;
  deliveryAddress: string;
  totalAmount: number;
  finalAmount: number;
  actualDeliveryDate?: string;
  isCurrent: boolean;
}

interface DisplayCheckoutSession {
  checkoutSessionId: number;
  status: string;
  statusLabel: string;
  statusColor: string;
  deliveryAddress: string;
  grossAmount: number;
  createdAt: string;
  secondsUntilTimeout?: number | null;
  lastPaymentError?: string | null;
  paymentFailedAt?: string | null;
  retryAvailableAt?: string | null;
  retryBlockReason?: string | null;
  canResumePayment: boolean;
  canRetryPayment: boolean;
}

@Component({
  selector: 'app-retailer-order-history',
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe],
  templateUrl: './retailer-order-history.component.html',
  styleUrls: ['./retailer-order-history.component.scss'],
})
export class RetailerOrderHistoryComponent implements OnInit, OnDestroy {
  orders: DisplayOrder[] = [];
  filteredOrders: DisplayOrder[] = [];
  checkoutSessions: DisplayCheckoutSession[] = [];
  pendingCheckoutSessions: DisplayCheckoutSession[] = [];
  failedCheckoutSessions: DisplayCheckoutSession[] = [];
  selectedFilter: string = 'all';
  isLoading = true;
  hasError = false;
  errorMessage: string = '';

  private destroy$ = new Subject<void>();
  private checkoutCountdownSub: Subscription | null = null;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private orderService: RetailerOrderHistoryService
  ) {
    addIcons({
      locationOutline,
      basketOutline,
      storefrontOutline,
      checkmarkCircle,
      timeOutline,
      checkmarkCircleOutline,
      cubeOutline,
      airplaneOutline,
      carOutline,
      bicycleOutline,
      checkmarkDoneCircle,
      closeCircleOutline,
      helpOutline,
      cardOutline,
      arrowUndoOutline,
    });
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopCheckoutCountdown();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.stopCheckoutCountdown();

    this.orderService.getOrderHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          try {
            const allOrders: DisplayOrder[] = [];

            // Current orders (status 1 to 5)
            if (response.current_orders && Array.isArray(response.current_orders)) {
              response.current_orders.forEach((o) => {
                allOrders.push(this.mapToDisplayOrder(o, true));
              });
            }

            // Past orders (delivered, cancelled, or null status)
            if (response.order_history && Array.isArray(response.order_history)) {
              response.order_history.forEach((o) => {
                allOrders.push(this.mapToDisplayOrder(o, false));
              });
            }

            // Sort newest first
            allOrders.sort((a, b) => {
              const dateA = new Date(a.placedAt).getTime();
              const dateB = new Date(b.placedAt).getTime();

              // First, compare by date
              if (dateB !== dateA) {
                return dateB - dateA;
              }

              // If dates are equal, compare by order ID
              return b.rawOrderId - a.rawOrderId;
            });
            this.orders = allOrders;
            this.filterOrders(this.selectedFilter);

            const checkoutSessions = (response.checkout_sessions || [])
              .map(session => this.mapToDisplayCheckoutSession(session))
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            this.checkoutSessions = checkoutSessions;
            this.updateCheckoutSessionBuckets();
            this.startCheckoutCountdown();

            this.isLoading = false;
          } catch (error) {
            // Error in data processing - show generic message
            this.errorMessage = this.translate.instant('RETAILER_ORDER_HISTORY.ERROR_MESSAGE');
            this.hasError = true;
            this.isLoading = false;
          }
        },
        error: (err) => {
          // Error comes from service with user-friendly message
          this.errorMessage = err?.message || this.translate.instant('RETAILER_ORDER_HISTORY.ERROR_MESSAGE');
          this.hasError = true;
          this.isLoading = false;
        },
      });
  }

  onSegmentChange(event: any): void {
    if (event?.detail?.value) {
      this.filterOrders(event.detail.value);
    }
  }

  filterOrders(filter: string): void {
    this.selectedFilter = filter;

    const isSuccessful = (statusName: string): boolean => {
      const value = statusName.toLowerCase();
      return value.includes('successful') || value.includes('delivered') || value.includes('complete');
    };

    const isCancelled = (statusName: string): boolean => {
      const value = statusName.toLowerCase();
      return value.includes('cancel') || value.includes('reject') || value.includes('fail');
    };

    const isReturned = (statusName: string): boolean => {
      const value = statusName.toLowerCase();
      return value.includes('return') || value.includes('refund');
    };

    if (filter === 'pending' || filter === 'failed') {
      this.filteredOrders = [];
    } else if (filter === 'all') {
      this.filteredOrders = [...this.orders];
    } else if (filter === 'active') {
      // Source of truth for active is backend grouping (current_orders).
      this.filteredOrders = this.orders.filter((o) => o.isCurrent);
    } else if (filter === 'successful') {
      this.filteredOrders = this.orders.filter((o) => isSuccessful(o.statusName));
    } else if (filter === 'cancelled') {
      this.filteredOrders = this.orders.filter((o) => isCancelled(o.statusName));
    } else if (filter === 'returned') {
      this.filteredOrders = this.orders.filter((o) => isReturned(o.statusName));
    } else {
      this.filteredOrders = this.orders.filter(
        (o) => o.statusName.toLowerCase() === filter.toLowerCase()
      );
    }
  }

  getStatusColor(statusId: number | null): string {
    if (statusId === null) {
      return 'medium';
    }

    const colors: { [key: number]: string } = {
      1: 'warning',
      2: 'primary',
      3: 'secondary',
      4: 'danger',
      5: 'success',
      6: 'success',
      7: 'medium',
      8: 'tertiary',
      9: 'medium',
      10: 'danger',
    };

    return colors[statusId] || 'medium';
  }

  getStatusIcon(statusId: number | null): string {
    if (statusId === null) {
      return 'help-outline';
    }

    const icons: { [key: number]: string } = {
      1: 'time-outline',
      2: 'checkmark-circle-outline',
      3: 'card-outline',
      4: 'close-circle-outline',
      5: 'checkmark-done-circle',
      6: 'checkmark-done-circle',
      7: 'arrow-undo-outline',
      8: 'cube-outline',
      9: 'arrow-undo-outline',
      10: 'close-circle-outline',
    };

    return icons[statusId] || 'help-outline';
  }

  onOrderClick(order: DisplayOrder): void {
    if (order?.rawOrderId) {
      this.navigateToOrderDetails(order);
    }
  }

  navigateToOrderDetails(order: DisplayOrder): void {
    this.router.navigate(['/buyer/retailer-order-details', order.rawOrderId]);
  }

  getOrderProgress(statusId: number | null): number {
    if (statusId === null) {
      return 0;
    }

    const progress: { [key: number]: number } = {
      1: 0.2,
      2: 0.4,
      3: 0.6,
      4: 0,
      5: 0.8,
      6: 1,
      7: 0.5,
      8: 0.8,
      9: 0.5,
      10: 0,
    };

    return progress[statusId] || 0;
  }

  getTranslatedFilterLabel(filter: string): string {
    const key = `RETAILER_ORDER_HISTORY.FILTER_${filter.toUpperCase()}`;
    const translation = this.translate.instant(key);
    return translation !== key ? translation : filter;
  }

  getNoOrdersMessage(filter: string): string {
    if (filter === 'all') {
      return this.translate.instant('RETAILER_ORDER_HISTORY.NO_ORDERS_DESC_ALL');
    }
    return this.translate.instant('RETAILER_ORDER_HISTORY.NO_ORDERS_DESC_FILTER', {
      filter: this.getTranslatedFilterLabel(filter),
    });
  }

  private mapToDisplayOrder(o: RetailerOrderHistory, isCurrent: boolean): DisplayOrder {
    const statusName = o.order_status_name || 'Unknown';
    const statusLabel = statusName;

    return {
      orderId: `ORD-${o.order_id.toString().padStart(6, '0')}`,
      rawOrderId: o.order_id,
      placedAt: o.date_of_order,
      statusId: o.order_status,
      statusName,
      statusLabel,
      deliveryAddress: o.delivery_address || '',
      totalAmount: o.total_order_amount || 0,
      finalAmount: o.final_amount || 0,
      actualDeliveryDate: o.actual_delivery_date || undefined,
      isCurrent,
    };
  }

  private mapToDisplayCheckoutSession(session: RetailerCheckoutSessionSummary): DisplayCheckoutSession {
    const statusLabel = this.getCheckoutSessionStatusLabel(session.status);
    return {
      checkoutSessionId: session.checkout_session_id,
      status: session.status,
      statusLabel,
      statusColor: this.getCheckoutSessionStatusColor(session.status),
      deliveryAddress: session.delivery_address || '',
      grossAmount: session.gross_amount || 0,
      createdAt: session.created_at,
      secondsUntilTimeout: session.seconds_until_timeout ?? null,
      lastPaymentError: session.last_payment_error ?? null,
      paymentFailedAt: session.payment_failed_at ?? null,
      retryAvailableAt: session.retry_available_at ?? null,
      retryBlockReason: session.retry_block_reason ?? null,
      canResumePayment: session.can_resume_payment && !session.payment_failed_at,
      canRetryPayment: session.can_retry_payment,
    };
  }

  getCheckoutSessionStatusLabel(status: string): string {
    const normalized = (status || '').toLowerCase();
    const map: { [key: string]: string } = {
      created: this.translate.instant('RETAILER_ORDER_HISTORY.CHECKOUT_STATUS_CREATED'),
      payment_pending: this.translate.instant('RETAILER_ORDER_HISTORY.CHECKOUT_STATUS_PENDING'),
      payment_failed: this.translate.instant('RETAILER_ORDER_HISTORY.CHECKOUT_STATUS_FAILED'),
      payment_expired: this.translate.instant('RETAILER_ORDER_HISTORY.CHECKOUT_STATUS_EXPIRED'),
      cancelled: this.translate.instant('RETAILER_ORDER_HISTORY.CHECKOUT_STATUS_CANCELLED'),
      payment_captured: this.translate.instant('RETAILER_ORDER_HISTORY.CHECKOUT_STATUS_SUCCESS'),
      materialized: this.translate.instant('RETAILER_ORDER_HISTORY.CHECKOUT_STATUS_SUCCESS'),
    };

    return map[normalized] || this.translate.instant('RETAILER_ORDER_HISTORY.CHECKOUT_STATUS_PENDING');
  }

  getCheckoutSessionStatusColor(status: string): string {
    const normalized = (status || '').toLowerCase();
    const map: { [key: string]: string } = {
      created: 'warning',
      payment_pending: 'warning',
      payment_failed: 'danger',
      payment_expired: 'medium',
      cancelled: 'medium',
      payment_captured: 'success',
      materialized: 'success',
    };

    return map[normalized] || 'medium';
  }

  getCheckoutSessionTimeoutText(seconds?: number | null): string {
    if (!seconds || seconds <= 0) {
      return this.translate.instant('RETAILER_ORDER_HISTORY.CHECKOUT_TIMEOUT_EXPIRED');
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formatted = `${minutes}m ${remainingSeconds}s`;
    return this.translate.instant('RETAILER_ORDER_HISTORY.CHECKOUT_TIMEOUT_REMAINING', { time: formatted });
  }

  showPendingPayments(): boolean {
    return (this.selectedFilter === 'all' || this.selectedFilter === 'pending')
      && this.pendingCheckoutSessions.length > 0;
  }

  showFailedPayments(): boolean {
    return (this.selectedFilter === 'all' || this.selectedFilter === 'failed')
      && this.failedCheckoutSessions.length > 0;
  }

  showOrdersList(): boolean {
    return this.selectedFilter !== 'pending' && this.selectedFilter !== 'failed';
  }

  openCheckoutSessionPayment(session: DisplayCheckoutSession): void {
    this.router.navigate(['/buyer/payment'], {
      state: {
        checkoutSessionId: session.checkoutSessionId,
        fromOrderHistory: true
      }
    });
  }

  private isPendingCheckoutSession(status: string): boolean {
    const normalized = (status || '').toLowerCase();
    return normalized === 'created' || normalized === 'payment_pending';
  }

  private isFailedCheckoutSession(status: string): boolean {
    const normalized = (status || '').toLowerCase();
    return normalized === 'payment_failed' || normalized === 'payment_expired' || normalized === 'cancelled';
  }

  private updateCheckoutSessionBuckets(): void {
    this.pendingCheckoutSessions = this.checkoutSessions.filter(session =>
      this.isPendingCheckoutSession(session.status) && !session.paymentFailedAt
    );
    this.failedCheckoutSessions = this.checkoutSessions.filter(session =>
      this.isFailedCheckoutSession(session.status) || !!session.paymentFailedAt
    );
  }

  private startCheckoutCountdown(): void {
    if (this.pendingCheckoutSessions.length === 0) {
      return;
    }

    this.checkoutCountdownSub = interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        let updated = false;
        this.checkoutSessions = this.checkoutSessions.map(session => {
          if (!this.isPendingCheckoutSession(session.status)) {
            return session;
          }
          if (session.secondsUntilTimeout === null || session.secondsUntilTimeout === undefined) {
            return session;
          }
          if (session.secondsUntilTimeout <= 0) {
            return session;
          }

          updated = true;
          return {
            ...session,
            secondsUntilTimeout: session.secondsUntilTimeout - 1
          };
        });

        if (updated) {
          this.updateCheckoutSessionBuckets();
        }
      });
  }

  private stopCheckoutCountdown(): void {
    if (this.checkoutCountdownSub) {
      this.checkoutCountdownSub.unsubscribe();
      this.checkoutCountdownSub = null;
    }
  }

  isSuccessfulStatus(statusName: string): boolean {
    const value = statusName.toLowerCase();
    return value.includes('successful') || value.includes('delivered') || value.includes('complete');
  }
}