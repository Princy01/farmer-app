import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  chevronBack,
  phonePortraitOutline,
  shieldCheckmarkOutline,
  lockClosedOutline,
  receiptOutline,
  cardOutline,
  checkmarkCircle,
  walletOutline,
  cashOutline,
  businessOutline
} from 'ionicons/icons';
import { PaymentService } from './payment.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslatePipe } from '@ngx-translate/core';
import { OrderService, CreateOrderRequest } from '../order-confirmation/order.service';
@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
})
export class PaymentComponent implements OnInit, OnDestroy {
  orderData: any;
  selectedPaymentMethod: string = '';
  isProcessingPayment: boolean = false;
  loadingPaymentMethods: boolean = true;
  pollingInterval: any = null;
  pollingTimeout: any = null;

  hasTransport: boolean = false;
  transportInfo: any = null;

  paymentMethods = [
    {
      id: 'UPI',
      name: 'PAYMENT.UPI_NAME',
      description: 'PAYMENT.UPI_DESC',
      icon: 'phone-portrait-outline',
      available: true
    },
    {
      id: 'CARD',
      name: 'PAYMENT.CARD_NAME',
      description: 'PAYMENT.CARD_DESC',
      icon: 'card-outline',
      available: true
    },
    {
      id: 'NETBANKING',
      name: 'PAYMENT.NETBANKING_NAME',
      description: 'PAYMENT.NETBANKING_DESC',
      icon: 'business-outline',
      available: true
    },
    {
      id: 'WALLET',
      name: 'PAYMENT.WALLET_NAME',
      description: 'PAYMENT.WALLET_DESC',
      icon: 'wallet-outline',
      available: true
    },
    {
      id: 'COD',
      name: 'PAYMENT.COD_NAME',
      description: 'PAYMENT.COD_DESC',
      icon: 'cash-outline',
      available: true
    }
  ];
  toastCtrl: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private paymentService: PaymentService,
    private translate: TranslateService,
    private orderService: OrderService,
  ) {
    addIcons({
      chevronBack,
      phonePortraitOutline,
      shieldCheckmarkOutline,
      lockClosedOutline,
      receiptOutline,
      cardOutline,
      checkmarkCircle,
      walletOutline,
      cashOutline,
      businessOutline
    });

    const navigation = this.router.getCurrentNavigation();
    this.orderData = navigation?.extras?.state?.['orderData'];

    if (!this.orderData) {
      this.router.navigate(['/buyer/cart']);
      return;
    }
    // Extract transport information
    this.hasTransport = this.orderData.hasTransport || false;
    this.transportInfo = this.orderData.transportData;

    console.log('Payment page initialized with order data:', this.orderData);
    console.log('Has transport:', this.hasTransport);
    console.log('Transport info:', this.transportInfo);
  }

  ngOnInit() {
    setTimeout(() => {
      this.loadingPaymentMethods = false;
    }, 1000);
  }

  ngOnDestroy() {
    this.clearPolling();
  }

  // Helper method to get transport delivery type display name
  getTransportTypeName(): string {
    if (!this.transportInfo) return '';

    switch (this.transportInfo.delivery_type) {
      case 'standard':
        return this.translate.instant('RIDE.STANDARD_DELIVERY');
      case 'express':
        return this.translate.instant('RIDE.EXPRESS_DELIVERY');
      case 'priority':
        return this.translate.instant('RIDE.PRIORITY_DELIVERY');
      default:
        return this.transportInfo.delivery_type;
    }
  }

  // Helper method to get urgency display
  getUrgencyDisplay(): string {
    if (!this.transportInfo) return '';
    return this.transportInfo.urgency === 'urgent'
      ? this.translate.instant('PAYMENT.URGENT')
      : this.translate.instant('PAYMENT.NORMAL');
  }

  selectPaymentMethod(method: string) {
    this.selectedPaymentMethod = method;
  }

  getPaymentMethodName(): string {
    const method = this.paymentMethods.find(m => m.id === this.selectedPaymentMethod);
    return method ? this.translate.instant(method.name) : this.selectedPaymentMethod;
  }

  getProcessingMessage(): string {
    switch (this.selectedPaymentMethod) {
      case 'UPI':
        return this.translate.instant('PAYMENT.PROCESSING_UPI');
      case 'CARD':
        return this.translate.instant('PAYMENT.PROCESSING_CARD');
      case 'NETBANKING':
        return this.translate.instant('PAYMENT.PROCESSING_NETBANKING');
      case 'WALLET':
        return this.translate.instant('PAYMENT.PROCESSING_WALLET');
      case 'COD':
        return this.translate.instant('PAYMENT.PROCESSING_COD');
      default:
        return this.translate.instant('PAYMENT.PROCESSING_DEFAULT');
    }
  }

  getPayButtonText(): string {
    if (this.isProcessingPayment) {
      return this.translate.instant('PAYMENT.PROCESSING');
    }

    switch (this.selectedPaymentMethod) {
      case 'UPI':
        return this.translate.instant('PAYMENT.PAY_UPI');
      case 'CARD':
        return this.translate.instant('PAYMENT.PAY_CARD');
      case 'NETBANKING':
        return this.translate.instant('PAYMENT.PAY_NETBANKING');
      case 'WALLET':
        return this.translate.instant('PAYMENT.PAY_WALLET');
      case 'COD':
        return this.translate.instant('PAYMENT.PLACE_ORDER_COD');
      default:
        return this.translate.instant('PAYMENT.SELECT_METHOD');
    }
  }

  private async handleOrderCreation(orderData: any): Promise<any> {
    try {
      // Prepare order request matching backend structure
      const orderRequest: CreateOrderRequest = {
        date_of_order: orderData.date_of_order,
        order_status: orderData.order_status,
        desired_delivery_date: orderData.desired_delivery_date,
        retailer_id: orderData.retailer_id,
        wholeseller_id: orderData.wholeseller_id,
        total_order_amount: orderData.total_order_amount,
        discount_amount: orderData.discount_amount,
        tax_amount: orderData.tax_amount,
        final_amount: orderData.final_amount,
        items: orderData.items.map((item: any) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_id: item.unit_id,
          price_while_added: item.price_while_added
        }))
      };

      // Create the order
      const orderResponse = await this.orderService.createOrder(orderRequest).toPromise();

      if (!orderResponse || !orderResponse.selected_id) {
        throw new Error('Invalid order response');
      }

      const orderId = orderResponse.selected_id;
      console.log('Order created successfully:', orderId);

      // Prepare response data
      const responseData = {
        ...orderData,
        orderId: orderId,
        orderStatus: orderData.order_status,
        orderNumber: `ORD-${orderId}`,
        orderDate: new Date(),
        transportJobCreated: false
      };

      // Create transport job if transport was requested
      if (orderData.hasTransport && orderData.transportData) {
        try {
          await this.createTransportJob(orderId, orderData.transportData);
          responseData.transportJobCreated = true;
        } catch (transportError) {
          console.error('Transport job creation failed:', transportError);
          // Don't fail the entire order, just log the error
          responseData.transportJobCreated = false;
          responseData.transportError = 'Transport job creation failed, but order was placed successfully';

          await this.showToast(
            this.translate.instant('PAYMENT.TRANSPORT_JOB_FAILED'),
            'warning'
          );
        }
      }

      return responseData;
    } catch (error) {
      console.error('Order creation failed:', error);
      throw new Error('Order creation failed');
    }
  }

  private async createTransportJob(orderId: number, transportData: any): Promise<void> {
    const transportRequest = {
      order_ids: [orderId],
      pickup_location: transportData.pickup_location,
      dropoff_location: transportData.dropoff_location,
      pickup_city_id: transportData.pickup_city_id,
      dropoff_city_id: transportData.dropoff_city_id,
      pickup_branch_id: transportData.pickup_branch_id,
      dropoff_branch_id: transportData.dropoff_branch_id,
      weight: transportData.weight,
      distance: transportData.distance,
      delivery_type: transportData.delivery_type,
      base_price: transportData.base_price,
      urgency: transportData.urgency,
      requested_date: transportData.requested_date,
      load_type: transportData.load_type,
      status: transportData.status
    };

    console.log('Creating transport job with request:', transportRequest);

    try {
      const response = await this.orderService.createTransportJob(transportRequest).toPromise();
      console.log('Transport job created successfully:', response);
    } catch (error: any) {
      console.error('Transport job creation error:', error);
      if (error.error) {
        console.error('Backend error response:', error.error);
      }
      throw error;
    }
  }

  async processPayment() {
    if (!this.selectedPaymentMethod) {
      const alert = await this.alertCtrl.create({
        header: this.translate.instant('PAYMENT.METHOD_REQUIRED'),
        message: this.translate.instant('PAYMENT.SELECT_METHOD_MSG'),
        buttons: [this.translate.instant('PAYMENT.OK')]
      });
      await alert.present();
      return;
    }

    this.isProcessingPayment = true;

    if (this.selectedPaymentMethod === 'COD') {
      const loading = await this.loadingCtrl.create({
        message: this.getProcessingMessage(),
        spinner: 'dots'
      });
      await loading.present();

      try {
        await this.simulatePaymentProcessing();
        const updatedOrderData = await this.handleOrderCreation(this.orderData);
        await loading.dismiss();

        this.router.navigate(['/buyer/order-confirmation'], {
          state: { orderData: updatedOrderData }
        });
      } catch (error) {
        console.error('Payment processing error:', error);
        await loading.dismiss();
        this.isProcessingPayment = false;
        await this.showPaymentError();
      }
      return;
    }

    // Online payment logic
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('PAYMENT.REDIRECTING'),
      spinner: 'dots'
    });
    await loading.present();

    try {
      const amount = this.orderData?.final_amount || this.orderData?.grandTotal;
      const description = this.translate.instant('PAYMENT.ORDER_DESC', {
        count: this.orderData?.items?.length || 1
      });
      const currency = 'inr';

      const response = await this.paymentService.initiatePayment(
        amount,
        currency,
        description
      ).toPromise();

      await loading.dismiss();

      if (response?.data?.payment_url && response?.data?.order_id) {
        const paymentUrl = response.data.payment_url;
        const paymentOrderId = response.data.order_id;

        // Open payment gateway in new window
        window.open(paymentUrl, '_blank');

        // Show loading while polling for payment status
        await this.pollPaymentStatus(paymentOrderId);
      } else {
        throw new Error('Invalid payment response');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      await loading.dismiss();
      this.isProcessingPayment = false;
      await this.showPaymentError();
    }
  }

  private async pollPaymentStatus(paymentOrderId: string): Promise<void> {
    const pollingLoading = await this.loadingCtrl.create({
      message: this.translate.instant('PAYMENT.CHECKING_STATUS'),
      spinner: 'dots'
    });
    await pollingLoading.present();

    let attempts = 0;
    const maxAttempts = 40;

    this.pollingInterval = setInterval(async () => {
      attempts++;

      try {
        const statusResponse = await this.paymentService
          .checkPaymentStatus(paymentOrderId)
          .toPromise();

        if (statusResponse?.status === 'success') {
          this.clearPolling();
          await pollingLoading.dismiss();

          const updatedOrderData = await this.handleOrderCreation(this.orderData);

          this.router.navigate(['/buyer/order-confirmation'], {
            state: { orderData: updatedOrderData }
          });
        } else if (statusResponse?.status === 'failed') {
          this.clearPolling();
          await pollingLoading.dismiss();
          await this.showPaymentError(
            this.translate.instant('PAYMENT.PAYMENT_FAILED_MSG')
          );
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }

      if (attempts >= maxAttempts) {
        this.clearPolling();
        await pollingLoading.dismiss();
        await this.showPaymentError(
          this.translate.instant('PAYMENT.PAYMENT_TIMEOUT')
        );
      }
    }, 3000);

    this.pollingTimeout = setTimeout(() => {
      this.clearPolling();
    }, maxAttempts * 3000);
  }

  private clearPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    if (this.pollingTimeout) {
      clearTimeout(this.pollingTimeout);
      this.pollingTimeout = null;
    }
  }

  private async showToast(message: string, color: string = 'dark'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  private simulatePaymentProcessing(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  }

  private async showPaymentError(message?: string) {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PAYMENT.PAYMENT_FAILED'),
      message: message || this.translate.instant('PAYMENT.PAYMENT_ERROR_MSG'),
      buttons: [this.translate.instant('PAYMENT.OK')]
    });
    await alert.present();
    this.isProcessingPayment = false;
  }

  goBack() {
    this.router.navigate(['/buyer/checkout'], {
      state: {
        cartItems: this.orderData.items,
        totalPrice: this.orderData.total_order_amount,
        discount: this.orderData.discount_amount,
        retailer: this.orderData.retailer,
        wholeseller: { id: this.orderData.wholeseller_id },
        selectedBranch: this.orderData.selectedBranch,
        transportData: this.transportInfo,
        hasRideRequest: this.hasTransport
      }
    });
  }
}