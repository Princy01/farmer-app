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
import { OrderService, Item, CreateBatchOrderRequest, TransportRequestWithOrders } from '../order-confirmation/order.service';
import { environment } from 'src/environments/environment';

type PaymentMode = 'simulated' | 'gateway';

interface PaymentNavigationState {
  orderData: any;
  hasTransport: boolean;
  transportData: any;
  paymentMeta: {
    mode: PaymentMode;
    method: string;
  };
}

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
  readonly paymentMode: PaymentMode = environment.paymentMode === 'gateway' ? 'gateway' : 'simulated';

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
      console.error('No order data found in navigation state');
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

  get isSimulatedMode(): boolean {
    return this.paymentMode === 'simulated';
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
    if (this.isSimulatedMode) {
      return this.translate.instant('PAYMENT.PROCESSING_SIMULATED');
    }

    switch (this.selectedPaymentMethod) {
      case 'UPI':
        return this.translate.instant('PAYMENT.PROCESSING_UPI');
      case 'CARD':
        return this.translate.instant('PAYMENT.PROCESSING_CARD');
      case 'NETBANKING':
        return this.translate.instant('PAYMENT.PROCESSING_NETBANKING');
      case 'WALLET':
        return this.translate.instant('PAYMENT.PROCESSING_WALLET');
      default:
        return this.translate.instant('PAYMENT.PROCESSING_DEFAULT');
    }
  }

  getPayButtonText(): string {
    if (this.isProcessingPayment) {
      return this.translate.instant('PAYMENT.PROCESSING');
    }

    if (this.isSimulatedMode) {
      return this.translate.instant('PAYMENT.COMPLETE_SIMULATED');
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
      default:
        return this.translate.instant('PAYMENT.SELECT_METHOD');
    }
  }

  private isSelectedBranchVerified(): boolean {
    return this.orderData?.selectedBranch?.location_verification_status === 'verified';
  }

  private async handleOrderCreation(orderData: any): Promise<any> {
    try {
      if (!this.isSelectedBranchVerified()) {
        throw new Error(this.translate.instant('CHECKOUT.BRANCH_VERIFICATION_REQUIRED_MESSAGE'));
      }

      console.log('Creating batch order with data:', orderData);

      // Validate
      if (!orderData?.wholesalerGroups || orderData.wholesalerGroups.length === 0) {
        throw new Error(this.translate.instant('PAYMENT.ERROR_NO_ITEMS'));
      }

      const orderGroups = orderData.wholesalerGroups.map((group: any) => ({
        wholeseller_id: group.wholesalerId,
        branch_id: group.branchId,
        items: group.items.map((item: any) => ({
          selected_id: item.selected_id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_id: item.unit_id,
          price: item.price ?? item.latest_wholesaler_price ?? 0,
          discount_amount: 0,  // per-item discount (usually 0, group discount is at group level)
          tax_amount: 0,       // per-item tax (usually 0, group tax is at group level)
          wholeseller_id: group.wholesalerId,
          branch_id: group.branchId,
        })),
        total_order_amount: group.subtotal,
        discount_amount: group.allocatedDiscount ?? 0,
        tax_amount: group.allocatedTax ?? 0,
        final_amount: group.finalAmount,
      }));

      const batchRequest = {
        date_of_order: new Date().toISOString().split('T')[0],
        order_status: 1,
        delivery_address: orderData.deliveryAddress,
        retailer_branch_id: orderData.retailerBranchId,
        order_groups: orderGroups,
        delivery_amount: orderData.transporterCost ?? 0,
      };

      console.log('Batch order request:', batchRequest);

      // Call batch endpoint
      const response = await this.orderService.createOrder(batchRequest).toPromise();

      if (!response || !response.order_ids || response.order_ids.length === 0) {
        throw new Error(this.translate.instant('PAYMENT.ERROR_ORDER_CREATION'));
      }

      console.log('Batch order response:', response);

      const orderIds = response.order_ids;

      // Update orderData with response
      const updatedOrderData = {
        ...orderData,
        orderIds: orderIds,
        orderId: orderIds[0],
        ordersTotal: response.orders_total,
        deliveryCost: response.delivery_cost,
        grandTotal: response.grand_total,
      };

      // If transport is selected, create transport job
      if (this.hasTransport && this.transportInfo) {
        await this.createTransportJob(orderIds, this.transportInfo);
      }

      return updatedOrderData;

    } catch (error: any) {
      console.error('Order creation error:', error);
      throw error;
    }
  }

  private async createTransportJob(orderIds: number[], transportData: any): Promise<void> {
    try {
      const transportRequest: TransportRequestWithOrders = {
        distance: transportData.distance || 50,
        delivery_type: transportData.delivery_type,
        urgency: transportData.urgency || null,
        requested_date: transportData.requested_date
          ? new Date(transportData.requested_date)
          : null,
        load_type: transportData.load_type || 'general',
        status: 'open',
        order_ids: orderIds,
        base_price: transportData.base_price || 0
      };

      console.log('Creating transport job with request:', transportRequest);

      const response = await this.orderService.createTransportJob(transportRequest).toPromise();
      console.log('Transport job created successfully:', response);

    } catch (error: any) {
      console.error('Transport job creation failed:', error);
      // Don't throw - order is already created, just log the transport error
      await this.showToast(
        this.translate.instant('PAYMENT.ERROR_TRANSPORT_JOB'),
        'warning'
      );
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

    if (this.isProcessingPayment) {
      return;
    }

    this.isProcessingPayment = true;

    if (this.isSimulatedMode) {
      await this.processSimulatedPayment();
      return;
    }

    await this.processGatewayPayment();
  }

  private async processSimulatedPayment(): Promise<void> {
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
        this.translate.instant('PAYMENT.SIMULATED_SUCCESS'),
        'success'
      );

      this.navigateToOrderConfirmation(updatedOrderData);
    } catch (error: any) {
      console.error('Payment processing error:', error);
      await loading.dismiss();
      this.isProcessingPayment = false;

      const errorMessage = error?.message || this.translate.instant('PAYMENT.PAYMENT_ERROR_MSG');
      await this.showPaymentError(errorMessage);
    }
  }

  private async processGatewayPayment(): Promise<void> {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('PAYMENT.REDIRECTING'),
      spinner: 'dots'
    });
    await loading.present();

    try {
      const amount = this.orderData?.grandTotal ?? this.orderData?.grand_total ?? this.orderData?.final_amount ?? this.orderData?.finalAmount;
      const description = this.translate.instant('PAYMENT.ORDER_DESC', {
        count: this.orderData?.items?.length || 1
      });
      const currency = 'INR';

      const response = await this.paymentService.initiatePayment(
        amount,
        currency,
        description
      ).toPromise();

      await loading.dismiss();

      if (response?.data?.payment_url && response?.data?.order_id) {
        const paymentUrl = response.data.payment_url;
        const paymentOrderId = response.data.order_id;

        const paymentWindow = window.open(paymentUrl, '_blank', 'noopener,noreferrer');
        if (!paymentWindow) {
          throw new Error(this.translate.instant('PAYMENT.GATEWAY_WINDOW_BLOCKED'));
        }

        await this.pollPaymentStatus(paymentOrderId);
      } else {
        throw new Error('Invalid payment response');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      await loading.dismiss();
      this.isProcessingPayment = false;
      await this.showPaymentError(error instanceof Error ? error.message : undefined);
    }
  }

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

        const paymentStatus = statusResponse?.data?.status;

        if (paymentStatus === 'success') {
          this.clearPolling();
          await pollingLoading.dismiss();

          const updatedOrderData = await this.handleOrderCreation(this.orderData);

          await this.showToast(
            this.translate.instant('PAYMENT.PAYMENT_SUCCESS'),
            'success'
          );

          this.navigateToOrderConfirmation(updatedOrderData);
        } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
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
    }, 3000); // Poll every 3 seconds

    // Set overall timeout
    this.pollingTimeout = setTimeout(() => {
      this.clearPolling();
    }, maxAttempts * 3000);
  }

  private navigateToOrderConfirmation(updatedOrderData: any): void {
    const navigationState: PaymentNavigationState = {
      orderData: updatedOrderData,
      hasTransport: this.hasTransport,
      transportData: this.transportInfo,
      paymentMeta: {
        mode: this.paymentMode,
        method: this.selectedPaymentMethod
      }
    };

    this.router.navigate(['/buyer/order-confirmation'], {
      state: navigationState
    });
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
      }, 1500);
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
    if (this.isProcessingPayment) {
      return;
    }

    this.router.navigate(['/buyer/checkout'], {
      state: {
        cartItems: this.orderData?.items || [],
        totalPrice: this.orderData?.total_order_amount || 0,
        discount: this.orderData?.discount_amount || 0,
        retailer: this.orderData?.retailer,
        retailerBranchId: this.orderData?.retailerBranchId,
        wholeseller: { id: this.orderData?.wholeseller_id },
        selectedBranch: this.orderData?.selectedBranch,
        transportData: this.transportInfo,
        hasRideRequest: this.hasTransport
      }
    });
  }
}
