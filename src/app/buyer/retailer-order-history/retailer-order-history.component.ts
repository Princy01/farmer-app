import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  locationOutline,
  basketOutline,
  storefrontOutline,
  checkmarkCircle,
} from 'ionicons/icons';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { OrderService, RetailerOrderHistory } from './retailer-order-history.service';

interface DisplayOrder {
  orderId: string;
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
export class RetailerOrderHistoryComponent implements OnInit {
  orders: DisplayOrder[] = [];
  filteredOrders: DisplayOrder[] = [];
  selectedFilter: string = 'all';
  isLoading = true;
  hasError = false;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private orderService: OrderService
  ) {
    addIcons({
    alertCircleOutline,
    locationOutline,
    basketOutline,
    storefrontOutline,
    checkmarkCircle,
  });
  }

  ngOnInit() {
    this.loadOrders();
  }

  async loadOrders() {
    this.isLoading = true;
    this.hasError = false;

    this.orderService.getOrderHistory().subscribe({
      next: (response) => {
        const allOrders: DisplayOrder[] = [];

        // Current orders (status 1 to 5)
        response.current_orders.forEach((o) => {
          allOrders.push(this.mapToDisplayOrder(o, true));
        });

        // Past orders (delivered, cancelled, or null status)
        response.order_history.forEach((o) => {
          allOrders.push(this.mapToDisplayOrder(o, false));
        });

        // Sort newest first
        allOrders.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());

        this.orders = allOrders;
        this.filteredOrders = [...allOrders];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load order history', err);
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  private mapToDisplayOrder(o: RetailerOrderHistory, isCurrent: boolean): DisplayOrder {
    const status = this.getStatusFromCode(o.order_status);
    return {
      orderId: `ORD-${o.order_id.toString().padStart(6, '0')}`,
      placedAt: o.date_of_order,
      status,
      deliveryAddress: o.delivery_address,
      totalAmount: o.total_order_amount,
      finalAmount: o.final_amount,
      actualDeliveryDate: o.actual_delivery_date || undefined,
      isCurrent,
    };
  }

  private getStatusFromCode(code: number | null): string {
    if (code === null) return 'Cancelled'; // or 'Unknown' – adjust as needed
    switch (code) {
      case 1: return 'Placed';
      case 2: return 'Confirmed';
      case 3: return 'Packed';
      case 4: return 'Shipped';
      case 5: return 'In Transit'; // or 'Out for Delivery' – adjust if you have exact mapping
      case 6: return 'Delivered';
      default: return 'Cancelled';
    }
  }

  onSegmentChange(event: any) {
    const value = event.detail.value;
    this.filterOrders(value);
  }

  filterOrders(filter: string) {
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

  onOrderClick(order: DisplayOrder) {
    this.navigateToOrderDetails(order);
  }

  navigateToOrderDetails(order: DisplayOrder) {
    this.router.navigate(['/buyer/retailer-order-details'], {
      state: { order },
    });
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
    const key = 'RETAILER_ORDER_HISTORY.STATUS_' + status.toUpperCase().replace(/\s+/g, '_');
    return this.translate.instant(key);
  }

  getTranslatedFilterLabel(filter: string): string {
    const key = 'RETAILER_ORDER_HISTORY.FILTER_' + filter.toUpperCase();
    return this.translate.instant(key);
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