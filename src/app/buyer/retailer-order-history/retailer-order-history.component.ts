import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController, IonicModule, LoadingController } from '@ionic/angular';
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
import {
  RetailerOrderHistoryService,
  RetailerOrderHistory,
  RetailerCheckoutSessionSummary,
  OrderTransportStatus,
} from './retailer-order-history.service';

interface DisplayOrder {
  orderId: string;
  rawOrderId: number;
  rawOrderIds: number[];
  checkoutSessionId?: number | null;
  checkoutOrderCount: number;
  checkoutDeliveryAmount: number;
  checkoutGrossAmount: number;
  placedAt: string;
  statusId: number | null;
  statusName: string;
  statusLabel: string;
  deliveryAddress: string;
  totalAmount: number;
  deliveryAmount: number;
  finalAmount: number;
  actualDeliveryDate?: string;
  isCurrent: boolean;
  transportStatusLabel?: string;
  transportStatusNote?: string;
  transportNeedsAdminAction?: boolean;
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
  retryAvailableAt?: string | null;
  retryBlockReason?: string | null;
  canResumePayment: boolean;
  canRetryPayment: boolean;
  canCancelCheckout: boolean;
}

type UnifiedItemType = 'order' | 'checkout-pending' | 'checkout-failed';

interface UnifiedItem {
  type: UnifiedItemType;
  date: string; // ISO date string used for sorting
  order?: DisplayOrder;
  session?: DisplayCheckoutSession;
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

  /** Used only in the 'all' tab — merges orders + checkout sessions sorted by date descending */
  unifiedAllItems: UnifiedItem[] = [];

  selectedFilter: string = 'all';
  isLoading = true;
  hasError = false;
  errorMessage: string = '';
  cancellingCheckoutSessionIds = new Set<number>();
  cancellingOrderIds = new Set<number>();

  private destroy$ = new Subject<void>();
  private checkoutCountdownSub: Subscription | null = null;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private orderService: RetailerOrderHistoryService,
    private alertController: AlertController,
    private loadingController: LoadingController
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
    this.destroy$.next();
    this.destroy$.complete();
    this.stopCheckoutCountdown();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.stopCheckoutCountdown();

    this.orderService
      .getOrderHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          try {
            const rawOrders: DisplayOrder[] = [];

            if (response.current_orders && Array.isArray(response.current_orders)) {
              response.current_orders.forEach((o) => {
                rawOrders.push(this.mapToDisplayOrder(o, true));
              });
            }

            if (response.order_history && Array.isArray(response.order_history)) {
              response.order_history.forEach((o) => {
                rawOrders.push(this.mapToDisplayOrder(o, false));
              });
            }

            const allOrders = this.collapseCheckoutOrderGroups(rawOrders);
            this.orders = this.sortNewestFirst(allOrders);
            this.filterOrders(this.selectedFilter);

            const checkoutSessions = (response.checkout_sessions || [])
              .map(session => this.mapToDisplayCheckoutSession(session))
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            this.checkoutSessions = checkoutSessions;
            this.updateCheckoutSessionBuckets();
            this.rebuildUnifiedAllItems();
            this.startCheckoutCountdown();
            this.isLoading = false;
          } catch (error) {
            this.errorMessage = this.translate.instant('RETAILER_ORDER_HISTORY.ERROR_MESSAGE');
            this.hasError = true;
            this.isLoading = false;
          }
        },
        error: (err) => {
          this.errorMessage = err?.message || this.translate.instant('RETAILER_ORDER_HISTORY.ERROR_MESSAGE');
          this.hasError = true;
          this.isLoading = false;
        },
      });
  }

  /**
   * Merges all orders and all checkout sessions (pending + failed) into one
   * list sorted newest-first. Used exclusively by the 'all' tab so that nothing
   * is pinned to the top purely because of its type.
   */
  private rebuildUnifiedAllItems(): void {
    const items: UnifiedItem[] = [];

    for (const order of this.orders) {
      items.push({ type: 'order', date: order.placedAt, order });
    }

    for (const session of this.pendingCheckoutSessions) {
      items.push({ type: 'checkout-pending', date: session.createdAt, session });
    }

    for (const session of this.failedCheckoutSessions) {
      items.push({ type: 'checkout-failed', date: session.createdAt, session });
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.unifiedAllItems = items;
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
      lastPaymentError: this.getPaymentErrorMessage(session.last_payment_error ?? null),
      retryAvailableAt: session.retry_available_at ?? null,
      retryBlockReason: this.getRetryBlockMessage(session.retry_block_reason ?? null),
      canResumePayment: session.can_resume_payment,
      canRetryPayment: session.can_retry_payment,
      canCancelCheckout: session.can_cancel_checkout,
    };
  }

  onSegmentChange(event: any): void {
    if (event?.detail?.value) {
      this.filterOrders(event.detail.value);
    }
  }

  private sortNewestFirst(orders: DisplayOrder[]): DisplayOrder[] {
    return orders.sort((a, b) => {
      const dateA = new Date(a.placedAt).getTime();
      const dateB = new Date(b.placedAt).getTime();
      if (dateB !== dateA) {
        return dateB - dateA;
      }
      return b.rawOrderId - a.rawOrderId;
    });
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

    if (filter === 'all' || filter === 'pending' || filter === 'failed') {
      // 'all' uses unifiedAllItems; 'pending'/'failed' use their own checkout session arrays
      this.filteredOrders = [];
    } else if (filter === 'active') {
      this.filteredOrders = this.sortNewestFirst(this.orders.filter((o) => o.isCurrent));
    } else if (filter === 'successful') {
      this.filteredOrders = this.sortNewestFirst(this.orders.filter((o) => isSuccessful(o.statusName)));
    } else if (filter === 'cancelled') {
      this.filteredOrders = this.sortNewestFirst(this.orders.filter((o) => isCancelled(o.statusName)));
    } else if (filter === 'returned') {
      this.filteredOrders = this.sortNewestFirst(this.orders.filter((o) => isReturned(o.statusName)));
    } else {
      this.filteredOrders = this.sortNewestFirst(
        this.orders.filter((o) => o.statusName.toLowerCase() === filter.toLowerCase())
      );
    }
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
      rawOrderIds: [o.order_id],
      checkoutSessionId: o.checkout_session_id ?? null,
      checkoutOrderCount: o.checkout_order_count || 0,
      checkoutDeliveryAmount: o.checkout_delivery_amount || 0,
      checkoutGrossAmount: o.checkout_gross_amount || 0,
      placedAt: o.date_of_order,
      statusId: o.order_status,
      statusName,
      statusLabel,
      deliveryAddress: o.delivery_address || '',
      totalAmount: o.total_order_amount || 0,
      deliveryAmount: o.delivery_amount || 0,
      finalAmount: o.final_amount || 0,
      actualDeliveryDate: o.actual_delivery_date || undefined,
      isCurrent,
      transportStatusLabel: this.getTransportStatusLabel(o.transport),
      transportStatusNote: this.getTransportStatusNote(o.transport),
      transportNeedsAdminAction: !!o.transport?.needs_admin_action,
    };
  }

  private getTransportStatusLabel(transport?: OrderTransportStatus | null): string | undefined {
    if (!transport?.status_label && !transport?.job_status && !transport?.delivery_status) {
      return undefined;
    }
    const key = this.getTransportStatusLabelKey(transport);
    if (key) {
      return this.translate.instant(key);
    }
    return transport.status_label || undefined;
  }

  private getTransportStatusNote(transport?: OrderTransportStatus | null): string | undefined {
    if (!transport?.status_note && !transport?.job_status && !transport?.delivery_status) {
      return undefined;
    }
    const key = this.getTransportStatusNoteKey(transport);
    if (key) {
      return this.translate.instant(key);
    }
    return transport.status_note || undefined;
  }

  private getTransportStatusLabelKey(transport: OrderTransportStatus): string | null {
    const jobStatus = (transport.job_status || '').toLowerCase();
    const deliveryStatus = (transport.delivery_status || '').toLowerCase();

    if (transport.needs_admin_action) return 'TRANSPORT_STATUS.ADMIN_REVIEW';
    if (jobStatus === 'cancelled' || jobStatus === 'canceled') return 'TRANSPORT_STATUS.CANCELLED';
    if (jobStatus === 'expired') return 'TRANSPORT_STATUS.NOT_ASSIGNED';
    if (jobStatus === 'ride_offered') return 'TRANSPORT_STATUS.BEING_OFFERED';
    if (jobStatus === 'open') return 'TRANSPORT_STATUS.REQUEST_OPEN';
    if (jobStatus === 'accepted' && deliveryStatus === 'pending') return 'TRANSPORT_STATUS.ACCEPTED_PICKUP_PENDING';
    if (jobStatus === 'accepted') return 'TRANSPORT_STATUS.DRIVER_ASSIGNED';
    if (jobStatus === 'picked_up' || deliveryStatus === 'picked_up') return 'TRANSPORT_STATUS.PICKED_UP_DELIVERY_PENDING';
    if (jobStatus === 'delivered' || deliveryStatus === 'delivered') return 'TRANSPORT_STATUS.DELIVERED';
    return null;
  }

  private getTransportStatusNoteKey(transport: OrderTransportStatus): string | null {
    const jobStatus = (transport.job_status || '').toLowerCase();

    if (transport.needs_admin_action) return 'TRANSPORT_STATUS.NOTES.ADMIN_REVIEW';
    if (jobStatus === 'cancelled' || jobStatus === 'canceled') return 'TRANSPORT_STATUS.NOTES.CANCELLED';
    if (jobStatus === 'expired') return 'TRANSPORT_STATUS.NOTES.NOT_ASSIGNED';
    if (jobStatus === 'open') return 'TRANSPORT_STATUS.NOTES.REQUEST_OPEN';
    return null;
  }

  private collapseCheckoutOrderGroups(orders: DisplayOrder[]): DisplayOrder[] {
    const grouped = new Map<number, DisplayOrder[]>();
    const result: DisplayOrder[] = [];

    for (const order of orders) {
      if (order.checkoutSessionId && order.checkoutOrderCount > 1) {
        const existing = grouped.get(order.checkoutSessionId) || [];
        existing.push(order);
        grouped.set(order.checkoutSessionId, existing);
      } else {
        result.push({
          ...order,
          deliveryAmount: order.deliveryAmount,
          finalAmount: order.finalAmount + order.deliveryAmount,
        });
      }
    }

    for (const groupOrders of grouped.values()) {
      const sortedGroup = this.sortNewestFirst([...groupOrders]);
      const primary = sortedGroup[0];
      const productFinalAmount = groupOrders.reduce((sum, order) => sum + order.finalAmount, 0);
      const totalOrderAmount = groupOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const checkoutDeliveryAmount = primary.checkoutDeliveryAmount || primary.deliveryAmount || 0;
      const checkoutGrossAmount = primary.checkoutGrossAmount || productFinalAmount + checkoutDeliveryAmount;
      const orderIds = sortedGroup.map(order => order.rawOrderId);

      result.push({
        ...primary,
        orderId: `${primary.orderId} +${sortedGroup.length - 1}`,
        rawOrderIds: orderIds,
        checkoutOrderCount: sortedGroup.length,
        totalAmount: totalOrderAmount,
        deliveryAmount: checkoutDeliveryAmount,
        finalAmount: checkoutGrossAmount,
        isCurrent: groupOrders.some(order => order.isCurrent),
      });
    }

    return result;
  }

  getStatusColor(statusId: number | null): string {
    if (statusId === null) return 'medium';
    const colors: { [key: number]: string } = {
      1: 'warning', 2: 'primary', 3: 'secondary', 4: 'danger',
      5: 'success', 6: 'success', 7: 'medium', 8: 'tertiary',
      9: 'medium', 10: 'danger',
    };
    return colors[statusId] || 'medium';
  }

  getStatusIcon(statusId: number | null): string {
    if (statusId === null) return 'help-outline';
    const icons: { [key: number]: string } = {
      1: 'time-outline', 2: 'checkmark-circle-outline', 3: 'card-outline',
      4: 'close-circle-outline', 5: 'checkmark-done-circle', 6: 'checkmark-done-circle',
      7: 'arrow-undo-outline', 8: 'cube-outline', 9: 'arrow-undo-outline',
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

  canCancelOrder(order: DisplayOrder): boolean {
    if (!order?.isCurrent || this.cancellingOrderIds.has(order.rawOrderId)) {
      return false;
    }
    const statusName = (order.statusName || '').toLowerCase();
    return !(
      statusName.includes('delivered') ||
      statusName.includes('complete') ||
      statusName.includes('cancel') ||
      statusName.includes('reject') ||
      statusName.includes('fail') ||
      statusName.includes('return') ||
      statusName.includes('refund') ||
      statusName.includes('dispute')
    );
  }

  isCancellingCheckoutSession(session: DisplayCheckoutSession): boolean {
    return this.cancellingCheckoutSessionIds.has(session.checkoutSessionId);
  }

  async confirmCancelCheckoutSession(session: DisplayCheckoutSession, event?: Event): Promise<void> {
    event?.stopPropagation();
    const alert = await this.alertController.create({
      header: this.translate.instant('RETAILER_ORDER_HISTORY.CANCEL_CHECKOUT_TITLE'),
      message: this.translate.instant('RETAILER_ORDER_HISTORY.CANCEL_CHECKOUT_MESSAGE'),
      buttons: [
        {
          text: this.translate.instant('RETAILER_ORDER_HISTORY.KEEP_ORDER'),
          role: 'cancel',
        },
        {
          text: this.translate.instant('RETAILER_ORDER_HISTORY.CANCEL_CHECKOUT'),
          role: 'destructive',
          handler: () => {
            this.cancelCheckoutSession(session);
          },
        },
      ],
    });
    await alert.present();
  }

  async confirmCancelPaidOrder(order: DisplayOrder, event?: Event): Promise<void> {
    event?.stopPropagation();
    const alert = await this.alertController.create({
      header: this.translate.instant('RETAILER_ORDER_HISTORY.CANCEL_ORDER_TITLE'),
      message: this.translate.instant('RETAILER_ORDER_HISTORY.CANCEL_ORDER_MESSAGE'),
      buttons: [
        {
          text: this.translate.instant('RETAILER_ORDER_HISTORY.KEEP_ORDER'),
          role: 'cancel',
        },
        {
          text: this.translate.instant('RETAILER_ORDER_HISTORY.CANCEL_ORDER'),
          role: 'destructive',
          handler: () => {
            this.cancelPaidOrder(order);
          },
        },
      ],
    });
    await alert.present();
  }

  private async cancelCheckoutSession(session: DisplayCheckoutSession): Promise<void> {
    if (this.cancellingCheckoutSessionIds.has(session.checkoutSessionId)) return;

    this.cancellingCheckoutSessionIds.add(session.checkoutSessionId);
    const loading = await this.loadingController.create({
      message: this.translate.instant('RETAILER_ORDER_HISTORY.CANCELLING'),
    });
    await loading.present();

    this.orderService
      .cancelCheckoutSession(session.checkoutSessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          this.cancellingCheckoutSessionIds.delete(session.checkoutSessionId);
          await loading.dismiss();
          await this.showInfoAlert(
            this.translate.instant('RETAILER_ORDER_HISTORY.CANCEL_SUCCESS_TITLE'),
            this.translate.instant('RETAILER_ORDER_HISTORY.CANCEL_CHECKOUT_SUCCESS')
          );
          this.loadOrders();
        },
        error: async (err) => {
          this.cancellingCheckoutSessionIds.delete(session.checkoutSessionId);
          await loading.dismiss();
          await this.showInfoAlert(
            this.translate.instant('RETAILER_ORDER_HISTORY.CANCEL_FAILED_TITLE'),
            err?.message || this.translate.instant('RETAILER_ORDER_HISTORY.CANCEL_FAILED')
          );
        },
      });
  }

  private async cancelPaidOrder(order: DisplayOrder): Promise<void> {
    if (this.cancellingOrderIds.has(order.rawOrderId)) return;

    this.cancellingOrderIds.add(order.rawOrderId);
    const loading = await this.loadingController.create({
      message: this.translate.instant('RETAILER_ORDER_HISTORY.CANCELLING'),
    });
    await loading.present();

    this.orderService
      .cancelPaidOrder(order.rawOrderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          this.cancellingOrderIds.delete(order.rawOrderId);
          await loading.dismiss();
          await this.showInfoAlert(
            this.translate.instant('RETAILER_ORDER_HISTORY.CANCEL_SUCCESS_TITLE'),
            this.translate.instant('RETAILER_ORDER_HISTORY.CANCEL_ORDER_SUCCESS')
          );
          this.loadOrders();
        },
        error: async (err) => {
          this.cancellingOrderIds.delete(order.rawOrderId);
          await loading.dismiss();
          await this.showInfoAlert(
            this.translate.instant('RETAILER_ORDER_HISTORY.CANCEL_FAILED_TITLE'),
            err?.message || this.translate.instant('RETAILER_ORDER_HISTORY.CANCEL_FAILED')
          );
        },
      });
  }

  private async showInfoAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [this.translate.instant('COMMON.OK') || 'OK'],
    });
    await alert.present();
  }

  getOrderProgress(statusId: number | null): number {
    if (statusId === null) return 0;
    const progress: { [key: number]: number } = {
      1: 0.2, 2: 0.4, 3: 0.6, 4: 0, 5: 0.8,
      6: 1, 7: 0.5, 8: 0.8, 9: 0.5, 10: 0,
    };
    return progress[statusId] || 0;
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
      created: 'warning', payment_pending: 'warning', payment_failed: 'danger',
      payment_expired: 'medium', cancelled: 'medium',
      payment_captured: 'success', materialized: 'success',
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

  private getPaymentErrorMessage(rawMessage: string | null): string | null {
    if (!rawMessage) return null;
    const message = rawMessage.toLowerCase();

    if (
      message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('deadline exceeded')
    ) {
      return this.translate.instant('RETAILER_ORDER_HISTORY.PAYMENT_ERROR_TIMEOUT');
    }

    if (
      message.includes('gateway error') ||
      message.includes('failed to call gateway') ||
      message.includes('connection refused') ||
      message.includes('dial tcp') ||
      message.includes('econnrefused') ||
      message.includes('network')
    ) {
      return this.translate.instant('RETAILER_ORDER_HISTORY.PAYMENT_ERROR_NETWORK');
    }

    if (
      message.includes('declined') ||
      message.includes('insufficient') ||
      message.includes('card') ||
      message.includes('upi') ||
      message.includes('bank')
    ) {
      return this.translate.instant('RETAILER_ORDER_HISTORY.PAYMENT_ERROR_DECLINED');
    }

    return this.translate.instant('RETAILER_ORDER_HISTORY.PAYMENT_ERROR_GENERIC');
  }

  private getRetryBlockMessage(rawReason: string | null): string | null {
    if (!rawReason) return null;
    return this.translate.instant('RETAILER_ORDER_HISTORY.PAYMENT_RETRY_BLOCKED');
  }

  // In 'all' mode, checkout sessions are shown inline via unifiedAllItems.
  // These methods now only control the dedicated pending/failed filter tabs.
  showPendingPayments(): boolean {
    return this.selectedFilter === 'pending' && this.pendingCheckoutSessions.length > 0;
  }

  showFailedPayments(): boolean {
    return this.selectedFilter === 'failed' && this.failedCheckoutSessions.length > 0;
  }

  showOrdersList(): boolean {
    return this.selectedFilter !== 'pending' && this.selectedFilter !== 'failed' && this.selectedFilter !== 'all';
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
      this.isPendingCheckoutSession(session.status)
    );
    this.failedCheckoutSessions = this.checkoutSessions.filter(session =>
      this.isFailedCheckoutSession(session.status)
    );
  }

  private startCheckoutCountdown(): void {
    if (this.pendingCheckoutSessions.length === 0) return;

    this.checkoutCountdownSub = interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        let updated = false;
        this.checkoutSessions = this.checkoutSessions.map(session => {
          if (!this.isPendingCheckoutSession(session.status)) return session;
          if (session.secondsUntilTimeout === null || session.secondsUntilTimeout === undefined) return session;
          if (session.secondsUntilTimeout <= 0) return session;

          updated = true;
          return { ...session, secondsUntilTimeout: session.secondsUntilTimeout - 1 };
        });

        if (updated) {
          this.updateCheckoutSessionBuckets();
          this.rebuildUnifiedAllItems();
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
