import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { OrderService, RetailerOrderResponse } from './order.service';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  receiptOutline,
  navigateOutline,
  homeOutline,
  timeOutline,
  locationOutline,
  callOutline,
  downloadOutline,
  bagOutline,
  cardOutline,
  cashOutline,
  rocketOutline
} from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslatePipe],
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.scss'],
})
export class OrderConfirmationComponent implements OnInit {
  orderData: any;
  estimatedDelivery: string = '';
  showAnimation: boolean = true;
  hasTransport: boolean = false;
  transportInfo: any = null;
  isLoading: boolean = false;

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
      timeOutline,
      locationOutline,
      callOutline,
      downloadOutline,
      bagOutline,
      cardOutline,
      cashOutline,
      rocketOutline
    });

    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state;

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

    this.orderData = state?.['orderData'];
    this.hasTransport = state?.['hasTransport'] || false;
    this.transportInfo = state?.['transportData'] || null;

    if (!this.orderData) {
      console.error('No order data found in navigation state');
      this.router.navigate(['/buyer/home']);
      return;
    }

    console.log('Order confirmation received:', {
      orderData: this.orderData,
      hasTransport: this.hasTransport,
      transportInfo: this.transportInfo
    });
  }

  async ngOnInit() {
    this.calculateDeliveryTime();

    // Show animation for 3 seconds, then fetch full details
    setTimeout(async () => {
      this.showAnimation = false;

      // Fetch detailed order information for the first order ID
      if (this.orderData?.order_ids && this.orderData.order_ids.length > 0) {
        await this.fetchOrderDetails(this.orderData.order_ids[0]);
      }
    }, 3000);
  }

  /**
   * Fetch full order details from backend
   * GET /getRetailerOrderDetails/:id
   */
  private async fetchOrderDetails(orderId: number): Promise<void> {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('ORDER_CONFIRMATION.LOADING_DETAILS'),
    });
    await loading.present();

    this.isLoading = true;

    this.orderService.getRetailerOrderDetails(orderId).subscribe({
      next: (response: RetailerOrderResponse) => {
        console.log('Backend response:', response);

        // Merge backend response with existing data
        this.orderData = {
          ...this.orderData,
          // Core order info
          orderId: response.order_id,
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
          finalAmount: response.final_amount,

          // Keep grand_total from original (includes all orders + delivery)
          grandTotal: this.orderData.grand_total || response.final_amount,

          // Items with full details
          items: response.items.map(item => ({
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

        console.log('Processed order data:', this.orderData);
        this.isLoading = false;
        loading.dismiss();
      },
      error: async (err) => {
        console.error('Failed to fetch order details:', err);
        this.isLoading = false;
        await loading.dismiss();
        await this.showErrorToast('ORDER_CONFIRMATION.FETCH_ERROR');
      }
    });
  }

  /**
   * Navigate to order tracking page
   */
  trackOrder() {
    const orderId = this.orderData?.order_ids?.[0] || this.orderData?.orderId;
    if (!orderId) {
      this.showErrorToast('ORDER_CONFIRMATION.NO_ORDER_ID');
      return;
    }
    this.router.navigate(['/buyer/order-tracking'], {
      queryParams: { orderId: orderId }
    });
  }

  /**
   * Navigate to order history
   */
  goToOrderHistory() {
    this.router.navigate(['/buyer/retailer-order-history']);
  }

  /**
   * Navigate to home page
   */
  goHome() {
    this.router.navigate(['/buyer/buyer-home']);
  }

  /**
   * Download invoice (placeholder implementation)
   */
  async downloadInvoice() {
    const orderId = this.orderData?.order_ids?.[0] || this.orderData?.orderId;
    if (!orderId) {
      await this.showErrorToast('ORDER_CONFIRMATION.NO_ORDER_ID');
      return;
    }

    // TODO: Implement invoice download functionality
    console.log('Downloading invoice for order:', orderId);
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
        return type;
    }
  }

  /**
   * Format date for display
   */
  getFormattedDate(date: Date | string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get status text based on order_status number
   */
  getStatusText(status: number): string {
    switch (status) {
      case 1:
        return this.translate.instant('ORDER_CONFIRMATION.STATUS_CONFIRMED');
      case 0:
        return this.translate.instant('ORDER_CONFIRMATION.STATUS_PENDING');
      default:
        return this.translate.instant('ORDER_CONFIRMATION.STATUS_UNKNOWN');
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