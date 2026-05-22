import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { OrderService, RetailerOrderResponse } from './order.service';
import { Subject, takeUntil } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  receiptOutline,
  navigateOutline,
  homeOutline,
  locationOutline,
  downloadOutline,
  bagOutline
} from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

interface TransportInfo {
  distance?: number;
  delivery_type?: string;
}

interface OrderConfirmationItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_id: number;
  unit_name: string;
  price: number;
  discount_amount: number;
  tax_amount: number;
  wholeseller_id: number;
  wholeseller_name: string;
}

interface OrderConfirmationData {
  order_ids?: number[];
  orderIds?: number[];
  orderId?: number;
  orderDate?: string;
  orderStatus?: number;
  actualDeliveryDate?: string | null;
  retailerId?: number;
  wholesellerIds?: number[];
  deliveryAddress?: string;
  totalOrderAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  deliveryAmount?: number;
  finalAmount?: number;
  grand_total?: number;
  grandTotal?: number;
  items?: OrderConfirmationItem[];
}

interface OrderConfirmationNavigationState {
  orderData?: OrderConfirmationData;
  hasTransport?: boolean;
  transportData?: TransportInfo;
  paymentMeta?: {
    mode?: string;
    method?: string;
  };
}

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslatePipe],
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.scss'],
})
export class OrderConfirmationComponent implements OnInit, OnDestroy {
  orderData: OrderConfirmationData | null = null;
  estimatedDelivery: string = '';
  showAnimation: boolean = true;
  hasTransport: boolean = false;
  transportInfo: TransportInfo | null = null;
  paymentMeta: { mode?: string; method?: string } | null = null;
  isLoading: boolean = false;
  loadErrorMessageKey: string | null = null;

  private readonly destroy$ = new Subject<void>();
  private animationTimerId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private router: Router,
    private orderService: OrderService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private translate: TranslateService
  ) {
    addIcons({
      checkmarkCircle,
      receiptOutline,
      navigateOutline,
      homeOutline,
      locationOutline,
      downloadOutline,
      bagOutline
    });

    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as OrderConfirmationNavigationState | undefined;

    // Expected state structure after order creation:
    // {
    //   orderData: {
    //     order_ids: number[],         // From CreateBatchOrderResponse
    //     grand_total: number,         // From CreateBatchOrderResponse
    //     orders_total: number,        // From CreateBatchOrderResponse
    //     delivery_cost: number,       // From CreateBatchOrderResponse
    //     deliveryAddress: string,     // From original request
    //     orderDate: string,           // From original request
    //   },
    //   hasTransport: boolean,
    //   transportData: any
    // }

    this.orderData = state?.orderData ?? null;
    this.hasTransport = state?.hasTransport ?? false;
    this.transportInfo = state?.transportData ?? null;
    this.paymentMeta = state?.paymentMeta ?? null;

    if (!this.orderData) {
      this.loadErrorMessageKey = 'ORDER_CONFIRMATION.NO_ORDER_DATA';
      void this.showErrorToast('ORDER_CONFIRMATION.NO_ORDER_DATA');
      void this.router.navigate(['/buyer/buyer-home']);
      return;
    }
  }

  ngOnInit(): void {
    this.calculateDeliveryTime();

    // Show animation for 3 seconds, then fetch full details
    this.animationTimerId = setTimeout(() => {
      this.showAnimation = false;

      // Fetch detailed order information for the first order ID
      const orderId = this.resolveOrderId();

      if (orderId) {
        this.fetchOrderDetails(orderId);
      } else {
        this.loadErrorMessageKey = 'ORDER_CONFIRMATION.NO_ORDER_ID';
        void this.showErrorToast('ORDER_CONFIRMATION.NO_ORDER_ID');
      }
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.animationTimerId) {
      clearTimeout(this.animationTimerId);
      this.animationTimerId = null;
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Fetch full order details from backend
   * GET /getRetailerOrderDetails/:id
   */
  private async fetchOrderDetails(orderId: number): Promise<void> {
    this.isLoading = true;
    this.loadErrorMessageKey = null;

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('ORDER_CONFIRMATION.LOADING_DETAILS'),
    });
    await loading.present();

    this.orderService.getRetailerOrderDetails(orderId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: RetailerOrderResponse) => {
        const safeItems = Array.isArray(response.items) ? response.items : [];
        const existingGrandTotal = this.orderData?.grandTotal ?? this.orderData?.grand_total;
        const deliveryAmount = response.delivery_amount || 0;

        // Merge backend response with existing data
        this.orderData = {
          ...this.orderData,
          // Core order info
          orderId: response.order_id,
          orderIds: response.order_ids?.length ? response.order_ids : this.resolveOrderIds(),
          order_ids: response.order_ids?.length ? response.order_ids : this.resolveOrderIds(),
          orderDate: response.date_of_order,
          orderStatus: response.order_status,
          actualDeliveryDate: response.actual_delivery_date,

          // IDs
          retailerId: response.retailer_id,
          wholesellerIds: response.wholeseller_ids,

          // Address
          deliveryAddress: response.delivery_address,

          // Amounts from this specific order
          totalOrderAmount: response.total_order_amount,
          discountAmount: response.discount_amount,
          taxAmount: response.tax_amount,
          deliveryAmount,
          finalAmount: response.final_amount,

          // Keep grand_total from original (includes all orders + delivery)
          grandTotal: existingGrandTotal ?? (response.final_amount + deliveryAmount),

          // Items with full details
          items: safeItems.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name || this.translate.instant('ORDER_CONFIRMATION.UNKNOWN_PRODUCT'),
            quantity: item.quantity,
            unit_id: item.unit_id,
            unit_name: item.unit_name || this.translate.instant('ORDER_CONFIRMATION.UNIT'),
            price: item.price,
            discount_amount: item.discount_amount,
            tax_amount: item.tax_amount,
            wholeseller_id: item.wholeseller_id,
            wholeseller_name: item.wholeseller_name || ''
          }))
        };

        this.isLoading = false;
        void loading.dismiss();
      },
      error: async (err) => {
        const errorKey = this.getOrderErrorMessageKey(err);
        this.loadErrorMessageKey = errorKey;

        if (err instanceof HttpErrorResponse && err.status === 401) {
          await this.router.navigate(['/login']);
        }

        this.isLoading = false;
        await loading.dismiss();
        await this.showErrorToast(errorKey);
      }
    });
  }

  retryFetchOrderDetails(): void {
    const orderId = this.resolveOrderId();
    if (!orderId) {
      void this.showErrorToast('ORDER_CONFIRMATION.NO_ORDER_ID');
      return;
    }

    void this.fetchOrderDetails(orderId);
  }

  /**
   * Navigate to order tracking page
   */
  trackOrder(): void {
    const orderId = this.resolveOrderId();
    if (!orderId) {
      void this.showErrorToast('ORDER_CONFIRMATION.NO_ORDER_ID');
      return;
    }

    void this.router.navigate(['/buyer/order-tracking'], {
      queryParams: { orderId: orderId }
    });
  }

  /**
   * Navigate to order history
   */
  goToOrderHistory(): void {
    void this.router.navigate(['/buyer/retailer-order-history']);
  }

  /**
   * Navigate to home page
   */
  goHome(): void {
    void this.router.navigate(['/buyer/buyer-home']);
  }

  /**
   * Download invoice (placeholder implementation)
   */
  async downloadInvoice(): Promise<void> {
    const orderId = this.resolveOrderId();
    if (!orderId) {
      await this.showErrorToast('ORDER_CONFIRMATION.NO_ORDER_ID');
      return;
    }

    await this.showSuccessToast('ORDER_CONFIRMATION.DOWNLOAD_COMING_SOON');
  }

  /**
   * Calculate estimated delivery time based on transport type
   */
  private calculateDeliveryTime(): void {
    if (this.hasTransport && this.transportInfo) {
      const deliveryType = this.transportInfo.delivery_type;
      switch (deliveryType) {
        case 'priority':
          this.estimatedDelivery = this.translate.instant('ORDER_CONFIRMATION.DELIVERY_PRIORITY');
          break;
        case 'express':
          this.estimatedDelivery = this.translate.instant('ORDER_CONFIRMATION.DELIVERY_EXPRESS');
          break;
        case 'standard':
          this.estimatedDelivery = this.translate.instant('ORDER_CONFIRMATION.DELIVERY_STANDARD');
          break;
        default:
          this.estimatedDelivery = this.translate.instant('ORDER_CONFIRMATION.DELIVERY_DEFAULT');
      }
    } else {
      this.estimatedDelivery = this.translate.instant('ORDER_CONFIRMATION.DELIVERY_NO_TRANSPORT');
    }
  }

  /**
   * Get transport type display name
   */
  getTransportTypeName(): string {
    if (!this.transportInfo) return '';

    const type = this.transportInfo.delivery_type;
    switch (type) {
      case 'standard':
        return this.translate.instant('ORDER_CONFIRMATION.TRANSPORT_STANDARD');
      case 'express':
        return this.translate.instant('ORDER_CONFIRMATION.TRANSPORT_EXPRESS');
      case 'priority':
        return this.translate.instant('ORDER_CONFIRMATION.TRANSPORT_PRIORITY');
      default:
        return this.translate.instant('ORDER_CONFIRMATION.TRANSPORT_UNKNOWN');
    }
  }

  getOrderGrandTotal(): number {
    const total = this.orderData?.grandTotal ?? this.orderData?.grand_total;
    if (typeof total === 'number') {
      return total;
    }

    return (this.orderData?.finalAmount || 0) + (this.orderData?.deliveryAmount || 0);
  }

  hasOrderItems(): boolean {
    return (this.orderData?.items?.length ?? 0) > 0;
  }

  getOrderIdBadgeText(): string {
    const orderIds = this.resolveOrderIds();
    if (orderIds.length === 0) {
      return this.orderData?.orderId ? `#${this.orderData.orderId}` : '#';
    }
    return orderIds.map((orderId) => `#${orderId}`).join(', ');
  }

  usedSimulatedPayment(): boolean {
    return this.paymentMeta?.mode === 'simulated';
  }

  /**
   * Get status text based on order_status number
   */
  getStatusText(status: number | undefined): string {
    switch (status) {
      case 1:
        return this.translate.instant('ORDER_CONFIRMATION.STATUS_CONFIRMED');
      case 0:
        return this.translate.instant('ORDER_CONFIRMATION.STATUS_PENDING');
      default:
        return this.translate.instant('ORDER_CONFIRMATION.STATUS_UNKNOWN');
    }
  }

  private resolveOrderId(): number | undefined {
    const idFromArray = this.resolveOrderIds()[0];
    return idFromArray ?? this.orderData?.orderId;
  }

  private resolveOrderIds(): number[] {
    const ids = this.orderData?.orderIds ?? this.orderData?.order_ids ?? [];
    const normalizedIds = Array.isArray(ids)
      ? ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
      : [];

    const fallbackId = Number(this.orderData?.orderId ?? 0);
    if (Number.isFinite(fallbackId) && fallbackId > 0 && !normalizedIds.includes(fallbackId)) {
      normalizedIds.unshift(fallbackId);
    }

    return normalizedIds;
  }

  private getOrderErrorMessageKey(error: unknown): string {
    if ((error as { name?: string })?.name === 'TimeoutError') {
      return 'ORDER_CONFIRMATION.TIMEOUT_ERROR';
    }

    if (!(error instanceof HttpErrorResponse)) {
      return 'ORDER_CONFIRMATION.FETCH_ERROR';
    }

    if (error.status === 0) {
      return 'ORDER_CONFIRMATION.NETWORK_ERROR';
    }

    switch (error.status) {
      case 401:
        return 'ORDER_CONFIRMATION.SESSION_EXPIRED';
      case 403:
        return 'ORDER_CONFIRMATION.PERMISSION_DENIED';
      case 404:
        return 'ORDER_CONFIRMATION.NOT_FOUND';
      case 408:
        return 'ORDER_CONFIRMATION.TIMEOUT_ERROR';
      default:
        if (error.status >= 500) {
          return 'ORDER_CONFIRMATION.SERVER_ERROR';
        }
        return 'ORDER_CONFIRMATION.FETCH_ERROR';
    }
  }

  /**
   * Show error toast
   */
  private async showErrorToast(messageKey: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: this.translate.instant(messageKey),
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  /**
   * Show success toast
   */
  private async showSuccessToast(messageKey: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: this.translate.instant(messageKey),
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }
}
