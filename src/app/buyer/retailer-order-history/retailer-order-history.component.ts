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
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  RetailerOrderHistoryService,
  RetailerOrderHistory,
  RetailerCheckoutSessionSummary,
} from './retailer-order-history.service';

interface DisplayOrder {
  orderId: string;
  rawOrderId: number;
  placedAt: string;
  status: string;
  deliveryAddress: string;
  totalAmount: number;
  finalAmount: number;
  actualDeliveryDate?: string;
  isCurrent: boolean;
}

interface DisplayPaymentSession {
  checkoutSessionId: string;
  rawCheckoutSessionId: number;
  status: string;
  deliveryAddress: string;
  totalAmount: number;
  placedAt: string;
  paymentTimeoutAt?: string;
  secondsUntilTimeout?: number;
  countdownLabel?: string;
  lastPaymentError?: string;
  canResumePayment: boolean;
  canRetryPayment: boolean;
  retryAttemptsUsed: number;
  maxRetryAttempts: number;
  retryAvailableAt?: string;
  retryBlockReason?: string;
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
  pendingPayments: DisplayPaymentSession[] = [];
  selectedFilter: string = 'all';
  isLoading = true;
  hasError = false;
  errorMessage: string = '';

  private destroy$ = new Subject<void>();
  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private orderService: RetailerOrderHistoryService
  ) {
    addIcons({
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
    });
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.stopCountdownTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.orderService
      .getOrderHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          try {
            const allOrders: DisplayOrder[] = [];

            if (response.current_orders && Array.isArray(response.current_orders)) {
              response.current_orders.forEach((o) => {
                allOrders.push(this.mapToDisplayOrder(o, true));
              });
            }

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
            this.pendingPayments = (response.checkout_sessions ?? []).map((session) =>
              this.mapToDisplayPaymentSession(session)
            );
            this.filterOrders(this.selectedFilter);
            this.startCountdownTimer();
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

  private mapToDisplayOrder(o: RetailerOrderHistory, isCurrent: boolean): DisplayOrder {
    const status = this.getStatusLabel(o.order_status_name, o.order_status);
    return {
      orderId: `ORD-${o.order_id.toString().padStart(6, '0')}`,
      rawOrderId: o.order_id,
      placedAt: o.date_of_order,
      status,
      deliveryAddress: o.delivery_address || '',
      totalAmount: o.total_order_amount || 0,
      finalAmount: o.final_amount || 0,
      actualDeliveryDate: o.actual_delivery_date || undefined,
      isCurrent,
    };
  }

  private mapToDisplayPaymentSession(session: RetailerCheckoutSessionSummary): DisplayPaymentSession {
    const secondsUntilTimeout = session.seconds_until_timeout ?? undefined;
    return {
      checkoutSessionId: `PAY-${session.checkout_session_id.toString().padStart(6, '0')}`,
      rawCheckoutSessionId: session.checkout_session_id,
      status: this.getCheckoutSessionStatusLabel(session.status, secondsUntilTimeout),
      deliveryAddress: session.delivery_address || '',
      totalAmount: session.gross_amount || 0,
      placedAt: session.created_at,
      paymentTimeoutAt: session.payment_timeout_at || undefined,
      secondsUntilTimeout,
      countdownLabel: this.formatCountdown(secondsUntilTimeout),
      lastPaymentError: session.last_payment_error || undefined,
      canResumePayment: session.can_resume_payment,
      canRetryPayment: session.can_retry_payment,
      retryAttemptsUsed: session.retry_attempts_used ?? 0,
      maxRetryAttempts: session.max_retry_attempts ?? 0,
      retryAvailableAt: session.retry_available_at || undefined,
      retryBlockReason: session.retry_block_reason || undefined,
    };
  }

  private startCountdownTimer(): void {
    this.stopCountdownTimer();
    if (!this.pendingPayments.some((payment) => !!payment.paymentTimeoutAt)) {
      return;
    }

    this.countdownTimer = setInterval(() => {
      this.pendingPayments = this.pendingPayments.map((payment) => {
        if (!payment.paymentTimeoutAt) {
          return payment;
        }

        const remainingSeconds = this.getRemainingSeconds(payment.paymentTimeoutAt);
        const becameFailed = remainingSeconds === 0 && payment.canResumePayment;
        return {
          ...payment,
          secondsUntilTimeout: remainingSeconds,
          countdownLabel: this.formatCountdown(remainingSeconds),
          canResumePayment: becameFailed ? false : payment.canResumePayment,
          canRetryPayment: becameFailed ? true : payment.canRetryPayment,
          status:
            becameFailed
              ? this.getCheckoutSessionStatusLabel('payment_failed', 0)
              : this.getCheckoutSessionStatusLabel(
                  payment.canRetryPayment ? 'payment_failed' : 'payment_pending',
                  remainingSeconds
                ),
        };
      });
    }, 1000);
  }

  private stopCountdownTimer(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private getRemainingSeconds(timeoutAt: string): number {
    const diffMs = new Date(timeoutAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diffMs / 1000));
  }

  private formatCountdown(seconds?: number): string {
    if (seconds === undefined || seconds === null) {
      return '';
    }
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  }

  private getStatusLabel(statusName?: string | null, code?: number | null): string {
    if (statusName && statusName.trim().length > 0) {
      return statusName.trim();
    }
    return this.getStatusFromCode(code);
  }

  private getStatusFromCode(code: number | null | undefined): string {
    if (code === null || code === undefined) return 'Unknown';

    const statusMap: { [key: number]: string } = {
      1: 'Order Created',
      2: 'Order Confirmed',
      3: 'Payment Pending',
      4: 'Payment Confirmed',
      5: 'Payment Failed',
      6: 'Delivery In Progress',
      7: 'Delivered',
      8: 'Cancelled By Buyer',
      9: 'Cancelled By Seller',
      10: 'Cancelled By Admin',
      11: 'Returned',
      12: 'Disputed',
    };

    return statusMap[code] || 'Unknown';
  }

  private getCheckoutSessionStatusLabel(status: string, secondsUntilTimeout?: number): string {
    if ((status === 'created' || status === 'payment_pending') && (secondsUntilTimeout ?? 0) > 0) {
      return 'Payment Pending';
    }
    if (status === 'payment_failed' || status === 'payment_expired') {
      return 'Payment Failed';
    }
    if (status === 'materialized') {
      return 'Payment Confirmed';
    }
    if (status === 'cancelled') {
      return 'Cancelled';
    }
    return 'Payment Pending';
  }

  onSegmentChange(event: any): void {
    if (event?.detail?.value) {
      this.filterOrders(event.detail.value);
    }
  }

  filterOrders(filter: string): void {
    this.selectedFilter = filter;

    if (filter === 'all') {
      this.filteredOrders = [...this.orders];
    } else if (filter === 'active') {
      this.filteredOrders = this.orders.filter((o) =>
        ['Order Created', 'Order Confirmed', 'Delivery In Progress'].includes(o.status)
      );
    } else if (filter === 'successful') {
      this.filteredOrders = this.orders.filter((o) => o.status === 'Delivered');
    } else if (filter === 'cancelled') {
      this.filteredOrders = this.orders.filter((o) =>
        ['Cancelled By Buyer', 'Cancelled By Seller', 'Cancelled By Admin'].includes(o.status)
      );
    } else if (filter === 'returned') {
      this.filteredOrders = this.orders.filter((o) =>
        ['Returned'].includes(o.status)
      );
    } else {
      this.filteredOrders = this.orders.filter(
        (o) => o.status.toLowerCase() === filter.toLowerCase()
      );
    }
  }

  onResumePayment(payment: DisplayPaymentSession): void {
    if (!payment.canResumePayment) {
      return;
    }

    this.router.navigate(['/buyer/payment'], {
      state: {
        checkoutSessionId: payment.rawCheckoutSessionId,
      },
    });
  }

  onRetryPayment(payment: DisplayPaymentSession): void {
    if (!payment.canRetryPayment) {
      return;
    }

    this.router.navigate(['/buyer/payment'], {
      state: {
        checkoutSessionId: payment.rawCheckoutSessionId,
      },
    });
  }

  getRetryInfo(payment: DisplayPaymentSession): string {
    if (payment.maxRetryAttempts > 0) {
      return `Attempts used: ${payment.retryAttemptsUsed}/${payment.maxRetryAttempts}`;
    }
    return '';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Order Created': 'warning',
      'Order Confirmed': 'primary',
      'Payment Pending': 'secondary',
      'Payment Confirmed': 'success',
      'Payment Failed': 'danger',
      'Delivery In Progress': 'tertiary',
      'Delivered': 'success',
      'Cancelled By Buyer': 'danger',
      'Cancelled By Seller': 'danger',
      'Cancelled By Admin': 'danger',
      'Returned': 'medium',
      'Disputed': 'warning',
      'Cancelled': 'danger',
      'Unknown': 'medium',
    };
    return colors[status] || 'medium';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'Order Created': 'time-outline',
      'Order Confirmed': 'checkmark-circle-outline',
      'Payment Pending': 'card-outline',
      'Payment Confirmed': 'checkmark-done-circle',
      'Payment Failed': 'close-circle-outline',
      'Delivery In Progress': 'cube-outline',
      'Delivered': 'checkmark-circle',
      'Cancelled By Buyer': 'close-circle-outline',
      'Cancelled By Seller': 'close-circle-outline',
      'Cancelled By Admin': 'close-circle-outline',
      'Returned': 'arrow-undo-outline',
      'Disputed': 'alert-circle-outline',
      'Cancelled': 'close-circle-outline',
      'Unknown': 'help-outline',
    };
    return icons[status] || 'help-outline';
  }

  onOrderClick(order: DisplayOrder): void {
    if (order?.rawOrderId) {
      this.navigateToOrderDetails(order);
    }
  }

  navigateToOrderDetails(order: DisplayOrder): void {
    this.router.navigate(['/buyer/retailer-order-details', order.rawOrderId]);
  }

  getOrderProgress(status: string): number {
    const progress: { [key: string]: number } = {
      'Order Created': 0.2,
      'Order Confirmed': 0.5,
      'Delivery In Progress': 0.8,
      'Delivered': 1.0,
      'Payment Pending': 0.1,
      'Payment Failed': 0,
      'Cancelled By Buyer': 0,
      'Cancelled By Seller': 0,
      'Cancelled By Admin': 0,
      'Returned': 0.5,
      'Disputed': 0.5,
      'Unknown': 0,
    };
    return progress[status] || 0;
  }

  getTranslatedStatus(status: string): string {
    const key = `RETAILER_ORDER_HISTORY.STATUS_${status.toUpperCase().replace(/\s+/g, '_')}`;
    const translation = this.translate.instant(key);
    return translation !== key ? translation : status;
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
}
