import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrderService, TransportRequestWithOrders } from '../order-confirmation/order.service';
import { environment } from 'src/environments/environment';
import { CheckoutSessionService, RetailerCheckoutSessionDetail, RetailerCheckoutSessionDetailResponse } from '../services/checkout-session.service';

type PaymentMode = 'simulated' | 'gateway';

interface PaymentNavigationState {
  orderData?: any;
  checkoutSessionId?: number;
  fromOrderHistory?: boolean;
  hasTransport?: boolean;
  transportData?: any;
  paymentMeta?: {
    mode?: PaymentMode;
    method?: string;
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
  orderData: any = null;
  checkoutSessionId: number | null = null;
  selectedPaymentMethod: string = '';
  isProcessingPayment: boolean = false;
  loadingPaymentMethods: boolean = true;
  isLoadingSession: boolean = false;
  pollingInterval: any = null;
  pollingTimeout: any = null;
  readonly paymentMode: PaymentMode = environment.paymentMode === 'gateway' ? 'gateway' : 'simulated';

  private readonly destroy$ = new Subject<void>();

  hasTransport: boolean = false;
  transportInfo: any = null;
  fromOrderHistory: boolean = false;

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
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private paymentService: PaymentService,
    private translate: TranslateService,
    private orderService: OrderService,
    private checkoutSessionService: CheckoutSessionService,
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
    const state = navigation?.extras?.state as PaymentNavigationState | undefined;
    this.orderData = state?.orderData ?? null;
    this.checkoutSessionId = state?.checkoutSessionId ?? this.orderData?.checkoutSessionId ?? null;
    this.fromOrderHistory = state?.fromOrderHistory ?? false;

    if (!this.orderData && !this.checkoutSessionId) {
      console.error('No order data or checkout session found in navigation state');
      this.router.navigate(['/buyer/cart']);
      return;
    }

    // Extract transport information
    this.hasTransport = this.orderData?.hasTransport || false;
    this.transportInfo = this.orderData?.transportData || null;

    console.log('Payment page initialized with order data:', this.orderData);
    console.log('Has transport:', this.hasTransport);
    console.log('Transport info:', this.transportInfo);
  }

  ngOnInit() {
    setTimeout(() => {
      this.loadingPaymentMethods = false;
    }, 1000);

    if (this.checkoutSessionId && (!this.orderData || !this.orderData?.checkoutSessionId)) {
      this.loadCheckoutSessionDetail(this.checkoutSessionId);
    }
  }

  ngOnDestroy() {
    this.clearPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCheckoutSessionDetail(checkoutSessionId: number): void {
    this.isLoadingSession = true;

    this.checkoutSessionService.getCheckoutSessionDetail(checkoutSessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: RetailerCheckoutSessionDetailResponse) => {
          const detail = response?.data as RetailerCheckoutSessionDetail | undefined;
          if (!detail) {
            throw new Error(this.translate.instant('PAYMENT.CHECKOUT_SESSION_LOAD_ERROR'));
          }

          const wholesalerGroups = (detail.order_groups || []).map(group => ({
            wholesalerId: group.wholeseller_id,
            branchId: group.branch_id ?? 0,
            wholesalerName: '',
            branchName: '',
            itemCount: group.items?.length ?? 0,
            subtotal: group.total_order_amount,
            items: (group.items || []).map(item => ({
              selected_id: item.selected_id ?? undefined,
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity,
              unit_id: item.unit_id,
              unit_name: item.unit_name,
              price_while_added: item.price,
              latest_wholesaler_price: item.price,
              is_active: true,
              wholesaler_id: item.wholeseller_id,
              branch_id: item.branch_id ?? undefined,
            })),
            allocatedDiscount: group.discount_amount,
            allocatedTax: group.tax_amount,
            finalAmount: group.final_amount,
          }));

          this.orderData = {
            ...this.orderData,
            checkoutSessionId: detail.checkout_session_id,
            wholesalerGroups,
            deliveryAddress: detail.delivery_address,
            totalPrice: detail.goods_amount,
            transporterCost: detail.delivery_amount,
            grandTotal: detail.gross_amount,
            hasTransport: detail.delivery_amount > 0,
          };

          this.checkoutSessionId = detail.checkout_session_id;
          this.hasTransport = this.orderData.hasTransport || false;
          this.isLoadingSession = false;
        },
        error: (err) => {
          const message = err?.message || this.translate.instant('PAYMENT.CHECKOUT_SESSION_LOAD_ERROR');
          this.isLoadingSession = false;
          void this.showPaymentError(message);
        }
      });
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

  get summaryItems(): any[] {
    return (this.orderData?.wholesalerGroups || []).flatMap((group: any) => group.items || []);
  }

  getItemsTotal(): number {
    if (typeof this.orderData?.totalPrice === 'number' && this.orderData.totalPrice > 0) {
      return this.orderData.totalPrice;
    }

    return (this.orderData?.wholesalerGroups || []).reduce(
      (sum: number, group: any) => sum + (group.subtotal || 0),
      0
    );
  }

  getTransportCost(): number {
    return this.orderData?.transporterCost
      || this.orderData?.transportCost
      || this.transportInfo?.base_price
      || 0;
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

  private async initiateCheckoutSessionPayment(): Promise<any> {
    if (!this.checkoutSessionId) {
      throw new Error(this.translate.instant('PAYMENT.CHECKOUT_SESSION_MISSING'));
    }

    const amountFromOrder = this.orderData?.grandTotal
      ?? this.orderData?.grand_total
      ?? this.orderData?.final_amount
      ?? this.orderData?.finalAmount
      ?? 0;
    const amount = amountFromOrder > 0 ? amountFromOrder : this.getItemsTotal() + this.getTransportCost();
    const description = this.translate.instant('PAYMENT.ORDER_DESC', {
      count: this.summaryItems?.length || 1
    });
    const currency = 'INR';

    return this.paymentService.initiatePayment({
      amount,
      currency,
      description,
      checkout_session_id: this.checkoutSessionId,
      provider_code: 'gateway',
      payment_method: this.selectedPaymentMethod
    }).toPromise();
  }

  private async processSimulatedPayment(): Promise<void> {
    await this.showToast(
      this.translate.instant('PAYMENT.SIMULATED_GATEWAY_NOTICE'),
      'warning'
    );

    await this.processGatewayPayment();
  }

  private async processGatewayPayment(): Promise<void> {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('PAYMENT.REDIRECTING'),
      spinner: 'dots'
    });
    await loading.present();

    try {
      const response = await this.initiateCheckoutSessionPayment();

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
          const orderIds = statusResponse?.data?.order_ids || [];
          const checkoutStatus = statusResponse?.data?.checkout_status || '';

          if (orderIds.length > 0) {
            this.clearPolling();
            await pollingLoading.dismiss();

            if (this.hasTransport && this.transportInfo) {
              await this.createTransportJob(orderIds, this.transportInfo);
            }

            const updatedOrderData = {
              ...this.orderData,
              orderIds: orderIds,
              orderId: orderIds[0],
              grandTotal: this.orderData?.grandTotal ?? statusResponse?.data?.amount
            };

            await this.showToast(
              this.translate.instant('PAYMENT.PAYMENT_SUCCESS'),
              'success'
            );

            this.navigateToOrderConfirmation(updatedOrderData);
          } else if (checkoutStatus === 'materialized') {
            this.clearPolling();
            await pollingLoading.dismiss();
            await this.showPaymentError(this.translate.instant('PAYMENT.MATERIALIZATION_MISSING'));
          }
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

    if (this.fromOrderHistory) {
      this.router.navigate(['/buyer/retailer-order-history']);
      return;
    }

    const wholesalerGroups = this.orderData?.wholesalerGroups || [];
    const cartItems = wholesalerGroups.flatMap((group: any) => group.items || []);
    const totalPrice = wholesalerGroups.reduce(
      (sum: number, group: any) => sum + (group.subtotal || 0),
      0
    );

    this.router.navigate(['/buyer/checkout'], {
      state: {
        cartItems,
        wholesalerGroups,
        totalPrice,
        discount: this.orderData?.discount || this.orderData?.discount_amount || 0,
        retailer: this.orderData?.retailer,
        wholeseller: this.orderData?.wholeseller || null,
        selectedBranch: this.orderData?.selectedBranch,
        transportData: this.transportInfo,
        hasRideRequest: this.hasTransport
      }
    });
  }
}
