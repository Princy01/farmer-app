import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import {
  timeOutline,
  checkmarkCircleOutline,
  cubeOutline,
  airplaneOutline,
  carOutline,
  bicycleOutline,
  checkmarkDoneCircle,
  businessOutline,
  locationOutline,
  arrowBackOutline,
  alertCircleOutline,
  flagOutline,
  listOutline,
} from 'ionicons/icons';
import { RetailerOrderService, RetailerOrderDetails, OrderItem } from './retailer-order-details.service';

/**
 * Component for displaying retailer order details.
 * Shows order information, items grouped by wholeseller, and order summary.
 */
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

  private destroy$ = new Subject<void>();

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
      businessOutline,
      locationOutline,
      arrowBackOutline,
      alertCircleOutline,
      flagOutline,
      listOutline,
    });
  }

  ngOnInit(): void {
    this.loadOrderDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads order details from the API based on order ID from route parameters.
   * Handles invalid IDs and API errors gracefully.
   */
  private loadOrderDetails(): void {
    const orderId = this.route.snapshot.paramMap.get('id');

    if (!orderId || isNaN(+orderId)) {
      this.error = this.translate.instant('RETAILER_ORDER_DETAILS.ERROR_INVALID_ID');
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    this.orderService
      .getOrderDetails(+orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: RetailerOrderDetails) => {
          this.order = data;
          this.loading = false;
          this.error = null;
        },
        error: (err: Error) => {
          // Error message is a translation key from service
          const translationKey = err.message || 'RETAILER_ORDER_DETAILS.ERROR_LOAD_FAILED';
          this.error = this.translate.instant(translationKey);
          this.loading = false;
        },
      });
  }

  /**
   * Retries loading order details after an error.
   */
  retry(): void {
    this.loadOrderDetails();
  }

  /**
   * Navigates back to the order history page.
   */
  goBack(): void {
    this.router.navigate(['/buyer/retailer-order-history']);
  }

  /**
   * Navigates to the buyer Report Issue screen for this order.
   */
  reportIssue(): void {
    if (!this.order?.order_id) {
      return;
    }

    this.router.navigate(['/buyer/report-issue', this.order.order_id]);
  }

  /**
   * Navigates to buyer My Issues screen and applies this order as filter.
   */
  openMyIssues(): void {
    if (this.order?.order_id) {
      this.router.navigate(['/buyer/my-issues'], {
        queryParams: { orderId: this.order.order_id },
      });
      return;
    }

    this.router.navigate(['/buyer/my-issues']);
  }

  /**
   * Returns the display label for an order status.
   * @param status Order status code
   * @returns Status label for translation lookup
   */
  getStatusLabel(status: number): string {
    const labels: { [key: number]: string } = {
      1: 'PLACED',
      2: 'CONFIRMED',
      3: 'PACKED',
      4: 'SHIPPED',
      5: 'IN_TRANSIT',
      6: 'DELIVERED',
    };
    return labels[status] || 'UNKNOWN';
  }

  /**
   * Returns the Ionic color for an order status badge.
   * @param status Order status code
   * @returns Color name suitable for Ionic color attribute
   */
  getStatusColor(status: number): string {
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

  /**
   * Returns the Ionicon name for an order status.
   * @param status Order status code
   * @returns Ionicon name
   */
  getStatusIcon(status: number): string {
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

  /**
   * Returns the translated status label for an order.
   * @param status Order status code
   * @returns Translated status string
   */
  getTranslatedStatus(status: number): string {
    const label = this.getStatusLabel(status);
    const key = `RETAILER_ORDER_DETAILS.STATUS_${label}`;
    const translation = this.translate.instant(key);
    return translation !== key ? translation : label;
  }

  /**
   * Calculates the subtotal for the order (before discount and tax).
   * @returns Subtotal amount
   */
  getSubtotal(): number {
    return this.order?.total_order_amount || 0;
  }

  /**
   * Calculates the final total for the order (after discount and tax).
   * @returns Final total amount
   */
  getTotal(): number {
    return this.order?.final_amount || 0;
  }

  /**
   * Calculates the subtotal for a single item (quantity × price).
   * @param item Order item
   * @returns Item subtotal
   */
  getItemTotal(item: OrderItem): number {
    return item.quantity * item.price;
  }

  /**
   * Gets the discount amount for an item.
   * @param item Order item
   * @returns Discount amount or 0
   */
  getItemDiscount(item: OrderItem): number {
    return item.discount_amount || 0;
  }

  /**
   * Gets the tax amount for an item.
   * @param item Order item
   * @returns Tax amount or 0
   */
  getItemTax(item: OrderItem): number {
    return item.tax_amount || 0;
  }

  /**
   * Calculates the final total for a single item (subtotal - discount + tax).
   * @param item Order item
   * @returns Final item total
   */
  getItemFinalTotal(item: OrderItem): number {
    const subtotal = this.getItemTotal(item);
    const discount = this.getItemDiscount(item);
    const tax = this.getItemTax(item);
    return subtotal - discount + tax;
  }
}