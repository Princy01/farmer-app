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
import { RetailerOrderHistoryService, RetailerOrderHistory } from './retailer-order-history.service';
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
  selectedFilter: string = 'all';
  isLoading = true;
  hasError = false;
  errorMessage: string = '';

  private destroy$ = new Subject<void>();

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
  }

  loadOrders(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

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

    if (filter === 'all') {
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

  isSuccessfulStatus(statusName: string): boolean {
    const value = statusName.toLowerCase();
    return value.includes('successful') || value.includes('delivered') || value.includes('complete');
  }
}