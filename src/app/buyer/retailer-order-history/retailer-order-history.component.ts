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
  status: string;
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

  private mapToDisplayOrder(o: RetailerOrderHistory, isCurrent: boolean): DisplayOrder {
    const status = this.getStatusFromCode(o.order_status);
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
  private getStatusFromCode(code: number | null): string {
    if (code === null) return 'Unknown';

    const statusMap: { [key: number]: string } = {
      1: 'Processing',
      2: 'Confirmed',
      3: 'Payment',
      4: 'Rejected',
      5: 'Successful',
      6: 'Cancellation',
      7: 'Returned',
      8: 'Picked Up',
      9: 'Return',
      10: 'Rejected',
    };

    return statusMap[code] || 'Unknown';
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
      // Active orders: Processing, Confirmed, Payment, Picked Up
      this.filteredOrders = this.orders.filter((o) =>
        ['Processing', 'Confirmed', 'Payment', 'Picked Up'].includes(o.status)
      );
    } else if (filter === 'successful') {
      this.filteredOrders = this.orders.filter((o) => o.status === 'Successful');
    } else if (filter === 'cancelled') {
      // Cancelled/Rejected orders
      this.filteredOrders = this.orders.filter((o) =>
        ['Rejected', 'Cancellation'].includes(o.status)
      );
    } else if (filter === 'returned') {
      this.filteredOrders = this.orders.filter((o) =>
        ['Returned', 'Return'].includes(o.status)
      );
    } else {
      this.filteredOrders = this.orders.filter(
        (o) => o.status.toLowerCase() === filter.toLowerCase()
      );
    }
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Processing': 'warning',
      'Confirmed': 'primary',
      'Payment': 'secondary',
      'Rejected': 'danger',
      'Successful': 'success',
      'Cancellation': 'danger',
      'Returned': 'medium',
      'Picked Up': 'tertiary',
      'Return': 'medium',
      'Unknown': 'medium',
    };
    return colors[status] || 'medium';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'Processing': 'time-outline',
      'Confirmed': 'checkmark-circle-outline',
      'Payment': 'card-outline',
      'Rejected': 'close-circle-outline',
      'Successful': 'checkmark-done-circle',
      'Cancellation': 'close-circle-outline',
      'Returned': 'arrow-undo-outline',
      'Picked Up': 'cube-outline',
      'Return': 'arrow-undo-outline',
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
      'Processing': 0.2,
      'Confirmed': 0.4,
      'Payment': 0.6,
      'Picked Up': 0.8,
      'Successful': 1.0,
      'Rejected': 0,
      'Cancellation': 0,
      'Returned': 0.5,
      'Return': 0.5,
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