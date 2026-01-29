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
} from 'ionicons/icons';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
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

  private subscriptions = new Subscription();

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
    });
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.hasError = false;

    const subscription = this.orderService.getOrderHistory().subscribe({
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
          allOrders.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());

          this.orders = allOrders;
          this.filterOrders(this.selectedFilter);
          this.isLoading = false;
        } catch (error) {
          console.error('Error processing order data:', error);
          this.hasError = true;
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Failed to load order history:', err);
        this.hasError = true;
        this.isLoading = false;
      },
    });

    this.subscriptions.add(subscription);
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
    if (code === null) return 'Cancelled';

    const statusMap: { [key: number]: string } = {
      1: 'Placed',
      2: 'Confirmed',
      3: 'Packed',
      4: 'Shipped',
      5: 'In Transit',
      6: 'Delivered',
    };

    return statusMap[code] || 'Cancelled';
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
      this.filteredOrders = this.orders.filter((o) => o.isCurrent);
    } else {
      this.filteredOrders = this.orders.filter(
        (o) => o.status.toLowerCase() === filter.toLowerCase()
      );
    }
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      Placed: 'medium',
      Confirmed: 'primary',
      Packed: 'secondary',
      Shipped: 'tertiary',
      'In Transit': 'warning',
      'Out for Delivery': 'warning',
      Delivered: 'success',
      Cancelled: 'danger',
    };
    return colors[status] || 'medium';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      Placed: 'time-outline',
      Confirmed: 'checkmark-circle-outline',
      Packed: 'cube-outline',
      Shipped: 'airplane-outline',
      'In Transit': 'car-outline',
      'Out for Delivery': 'bicycle-outline',
      Delivered: 'checkmark-done-circle',
      Cancelled: 'close-circle-outline',
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
      Placed: 0.2,
      Confirmed: 0.4,
      Packed: 0.6,
      Shipped: 0.7,
      'In Transit': 0.8,
      'Out for Delivery': 0.9,
      Delivered: 1.0,
      Cancelled: 0,
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