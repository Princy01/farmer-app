import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
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
      const orderRequest = {
        date_of_order: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        order_status: 1, // 1 for pending/new order
        delivery_address: orderData.deliveryAddress || orderData.selectedBranch?.address || '',
        items: orderData.items.map((item: any) => ({
          product_id: item.product_id || item.id,
          quantity: item.quantity,
          unit_id: item.unit_id || item.selectedUnit?.id || 1,
          price: item.price,
          discount_amount: item.discount || 0,
          tax_amount: item.tax || 0,
          wholeseller_id: item.wholesaler_id
        }))
      };

      console.log('Creating order with request:', orderRequest);

      const response = await this.orderService.createOrder(orderRequest).toPromise();

      if (!response || !response.order_ids || response.order_ids.length === 0) {
        throw new Error('No order IDs returned from server');
      }

      // If transport is required, create transport job
      if (this.hasTransport && this.transportInfo && response.order_ids.length > 0) {
        await this.createTransportJob(response.order_ids, this.transportInfo);
      }

      return {
        ...orderData,
        orderIds: response.order_ids,
        orderId: response.order_ids[0], // Primary order ID for display
        orderNumber: `ORD${response.order_ids[0]}`,
        orderDate: new Date(),
        paymentMethod: this.selectedPaymentMethod
      };
    } catch (error: any) {
      console.error('Order creation error:', error);
      throw error;
    }
  }

  private async createTransportJob(orderIds: number[], transportData: any): Promise<void> {
    try {
      const transportRequest = {
        order_ids: orderIds,
        pickup_location: transportData.pickup_location,
        dropoff_location: transportData.dropoff_location,
        pickup_city_id: transportData.pickup_city_id,
        dropoff_city_id: transportData.dropoff_city_id,
        pickup_branch_id: transportData.pickup_branch_id,
        dropoff_branch_id: transportData.dropoff_branch_id,
        weight: transportData.weight,
        distance: transportData.distance || 50,
        delivery_type: transportData.delivery_type,
        base_price: transportData.base_price,
        urgency: transportData.urgency,
        requested_date: new Date().toISOString(),
        load_type: transportData.load_type || 'general',
        status: 'pending'
      };

      console.log('Creating transport job with request:', transportRequest);

      const response = await this.orderService.createTransportJob(transportRequest).toPromise();
      console.log('Transport job created successfully:', response);

    } catch (error: any) {
      console.error('Transport job creation failed:', error);
      // Don't throw - order is already created, just log the transport error
      await this.showToast(
        'Order placed but transport request failed. Please contact support.',
        'warning'
      );
    }
  }

  // ============================================================================
  // CURRENT IMPLEMENTATION: Direct Order Placement (For Testing)
  // ============================================================================
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

    const loading = await this.loadingCtrl.create({
      message: this.getProcessingMessage(),
      spinner: 'dots'
    });
    await loading.present();

    try {
      // Simulate payment processing delay
      await this.simulatePaymentProcessing();

      // Create the order(s)
      const orderResponse = await this.handleOrderCreation(this.orderData);

      // If transport was selected, create transport job
      if (this.hasTransport && this.transportInfo && orderResponse.order_ids) {
        await this.createTransportJob(orderResponse.order_ids, this.transportInfo);
      }

      await loading.dismiss();

      await this.showToast(
        this.translate.instant('PAYMENT.ORDER_PLACED_SUCCESS'),
        'success'
      );

      // Navigate to order confirmation with complete data
      this.router.navigate(['/buyer/order-confirmation'], {
        state: {
          orderData: {
            ...this.orderData,
            orderIds: orderResponse.order_ids,
            orderId: orderResponse.order_ids[0], // Primary order ID for display
            hasTransport: this.hasTransport,
            transportData: this.transportInfo,
            paymentMethod: this.selectedPaymentMethod,
            orderDate: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      console.error('Payment processing error:', error);
      await loading.dismiss();
      this.isProcessingPayment = false;
      await this.showPaymentError();
    }
  }

  // ============================================================================
  // END: Current Implementation
  // ============================================================================


  // ============================================================================
  // COMMENTED CODE: Payment Gateway Integration (To be used later)
  // ============================================================================
  // UNCOMMENT THIS CODE WHEN READY TO USE ACTUAL PAYMENT GATEWAY
  /*
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

    // COD: Direct order placement
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

        await this.showToast(
          this.translate.instant('PAYMENT.ORDER_PLACED_SUCCESS'),
          'success'
        );

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

    // Online payment: Redirect to payment gateway
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

      // Initiate payment with gateway
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

        // Start polling for payment status
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
  */
  // ============================================================================
  // END: Payment Gateway Integration Code
  // ============================================================================


  // ============================================================================
  // COMMENTED CODE: Payment Status Polling (For payment gateway)
  // ============================================================================
  /*
  private async pollPaymentStatus(paymentOrderId: string): Promise<void> {
    const pollingLoading = await this.loadingCtrl.create({
      message: this.translate.instant('PAYMENT.CHECKING_STATUS'),
      spinner: 'dots'
    });
    await pollingLoading.present();

    let attempts = 0;
    const maxAttempts = 40; // 40 attempts * 3 seconds = 2 minutes max

    this.pollingInterval = setInterval(async () => {
      attempts++;

      try {
        const statusResponse = await this.paymentService
          .checkPaymentStatus(paymentOrderId)
          .toPromise();

        if (statusResponse?.status === 'success') {
          // Payment successful - create order
          this.clearPolling();
          await pollingLoading.dismiss();

          const updatedOrderData = await this.handleOrderCreation(this.orderData);

          await this.showToast(
            this.translate.instant('PAYMENT.PAYMENT_SUCCESS'),
            'success'
          );

          this.router.navigate(['/buyer/order-confirmation'], {
            state: { orderData: updatedOrderData }
          });
        } else if (statusResponse?.status === 'failed') {
          // Payment failed
          this.clearPolling();
          await pollingLoading.dismiss();
          await this.showPaymentError(
            this.translate.instant('PAYMENT.PAYMENT_FAILED_MSG')
          );
        }
        // If status is 'pending', continue polling
      } catch (error) {
        console.error('Error checking payment status:', error);
      }

      // Timeout after max attempts
      if (attempts >= maxAttempts) {
        this.clearPolling();
        await pollingLoading.dismiss();
        await this.showPaymentError(
          this.translate.instant('PAYMENT.PAYMENT_TIMEOUT')
        );
      }
    }, 3000); // Poll every 3 seconds

    // Set overall timeout
    this.pollingTimeout = setTimeout(() => {
      this.clearPolling();
    }, maxAttempts * 3000);
  }
  */
  // ============================================================================
  // END: Payment Status Polling Code
  // ============================================================================

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