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
    this.orderData = navigation?.extras?.state?.['orderData'];

    if (!this.orderData) {
      this.router.navigate(['/buyer/home']);
      return;
    }

    // Extract transport info safely
    this.hasTransport = this.orderData?.hasTransport || false;
    this.transportInfo = this.orderData?.transportData || null;

    console.log('Order confirmation data:', this.orderData);
    console.log('Has transport:', this.hasTransport);
  }

  async ngOnInit() {
    this.calculateDeliveryTime();

    // Fetch full order details if orderIds are available
    if (this.orderData?.orderIds && this.orderData.orderIds.length > 0) {
      await this.fetchOrderDetails(this.orderData.orderIds[0]);
    }

    setTimeout(() => {
      this.showAnimation = false;
    }, 3000);
  }

  private async fetchOrderDetails(orderId: number): Promise<void> {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('ORDER_CONFIRMATION.LOADING_DETAILS'),
    });
    await loading.present();

    this.isLoading = true;

    this.orderService.getRetailerOrderDetails(orderId).subscribe({
      next: (response: RetailerOrderResponse) => {
        this.orderData = {
          ...this.orderData,
          orderId: response.order_id,
          orderDate: response.date_of_order,
          deliveryAddress: response.delivery_address,
          grandTotal: response.final_amount,
          orderStatus: response.order_status,
          items: response.items.map(item => ({
            ...item,
            product_name: item.product_name || this.translate.instant('ORDER_CONFIRMATION.UNKNOWN_PRODUCT'),
            unit_name: item.unit_name || this.translate.instant('ORDER_CONFIRMATION.UNIT'),
            price: item.price
          }))
        };
        console.log('Fetched order details:', this.orderData);
        loading.dismiss();
        this.isLoading = false;
      },
      error: async (err) => {
        console.error('Failed to fetch order details:', err);
        await loading.dismiss();
        this.isLoading = false;
        await this.showErrorToast('ORDER_CONFIRMATION.FETCH_ERROR');
      }
    });
  }

  trackOrder() {
    const orderId = this.orderData?.orderIds?.[0] || this.orderData?.orderId;
    if (!orderId) {
      this.showErrorToast('ORDER_CONFIRMATION.NO_ORDER_ID');
      return;
    }
    this.router.navigate(['/buyer/order-tracking'], {
      queryParams: { orderId: orderId }
    });
  }

  goToOrderHistory() {
    this.router.navigate(['/buyer/retailer-order-history']);
  }

  goHome() {
    this.router.navigate(['/buyer/buyer-home']);
  }

  async downloadInvoice() {
    const orderId = this.orderData?.orderIds?.[0] || this.orderData?.orderId;
    if (!orderId) {
      await this.showErrorToast('ORDER_CONFIRMATION.NO_ORDER_ID');
      return;
    }

    // TODO: Implement invoice download functionality
    console.log('Downloading invoice for order:', orderId);
    await this.showSuccessToast('ORDER_CONFIRMATION.DOWNLOAD_COMING_SOON');
  }

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

  private async showErrorToast(messageKey: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: this.translate.instant(messageKey),
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

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