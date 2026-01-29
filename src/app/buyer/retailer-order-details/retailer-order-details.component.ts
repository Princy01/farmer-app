import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
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
import { RetailerOrderService, RetailerOrderDetails, OrderItem } from './retailer-order-details.service';

@Component({
  selector: 'app-retailer-order-details',
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe],
  templateUrl: './retailer-order-details.component.html',
  styleUrls: ['./retailer-order-details.component.scss'],
})
export class RetailerOrderDetailsComponent implements OnInit, OnDestroy {
  order: RetailerOrderDetails | null = null;
  loading = true;
  error: string | null = null;

  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private orderService: RetailerOrderService,
    private translate: TranslateService
  ) {
    addIcons({
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
    this.loadOrderDetails();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadOrderDetails(): void {
    const orderId = this.route.snapshot.paramMap.get('id');

    if (!orderId || isNaN(+orderId)) {
      this.error = this.translate.instant('RETAILER_ORDER_DETAILS.ERROR_INVALID_ID');
      this.loading = false;
      return;
    }

    const subscription = this.orderService.getOrderDetails(+orderId).subscribe({
      next: (data) => {
        this.order = data;
        this.loading = false;
        this.error = null;
      },
      error: (err) => {
        console.error('Error fetching order:', err);
        this.error = this.translate.instant('RETAILER_ORDER_DETAILS.ERROR_LOAD_FAILED');
        this.loading = false;
      }
    });

    this.subscriptions.add(subscription);
  }

  retry(): void {
    this.loading = true;
    this.error = null;
    this.loadOrderDetails();
  }

  goBack(): void {
    this.router.navigate(['/buyer/retailer-order-history']);
  }

  getStatusLabel(status: number | null): string {
    if (status === null) return 'Cancelled';

    const labels: { [key: number]: string } = {
      1: 'Placed',
      2: 'Confirmed',
      3: 'Packed',
      4: 'Shipped',
      5: 'In Transit',
      6: 'Delivered',
    };
    return labels[status] || 'Cancelled';
  }

  getStatusColor(status: number | null): string {
    if (status === null) return 'danger';

    const colors: { [key: number]: string } = {
      1: 'medium',
      2: 'primary',
      3: 'secondary',
      4: 'tertiary',
      5: 'warning',
      6: 'success',
    };
    return colors[status] || 'medium';
  }

  getStatusIcon(status: number | null): string {
    if (status === null) return 'close-circle-outline';

    const icons: { [key: number]: string } = {
      1: 'time-outline',
      2: 'checkmark-circle-outline',
      3: 'cube-outline',
      4: 'airplane-outline',
      5: 'car-outline',
      6: 'checkmark-done-circle',
    };
    return icons[status] || 'help-outline';
  }

  getTranslatedStatus(status: number | null): string {
    const label = this.getStatusLabel(status);
    const key = `RETAILER_ORDER_DETAILS.STATUS_${label.toUpperCase().replace(/\s+/g, '_')}`;
    const translation = this.translate.instant(key);
    return translation !== key ? translation : label;
  }

  getSubtotal(): number {
    return this.order?.total_order_amount || 0;
  }

  getTotal(): number {
    return this.order?.final_amount || 0;
  }

  getItemTotal(item: OrderItem): number {
    return item.quantity * item.price;
  }

  getItemDiscount(item: OrderItem): number {
    return item.discount_amount || 0;
  }

  getItemTax(item: OrderItem): number {
    return item.tax_amount || 0;
  }

  getItemFinalTotal(item: OrderItem): number {
    const subtotal = this.getItemTotal(item);
    const discount = this.getItemDiscount(item);
    const tax = this.getItemTax(item);
    return subtotal - discount + tax;
  }
}