import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  chevronBack,
  phonePortraitOutline,
  shieldCheckmarkOutline,
  lockClosedOutline,
  receiptOutline,
  cardOutline,
  checkmarkCircle,
  timeOutline,
  walletOutline,
  cashOutline,
  businessOutline
} from 'ionicons/icons';
import { CheckoutSessionDetailResponse, PaymentService } from './payment.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslatePipe } from '@ngx-translate/core';
import { OrderService, Item, CreateBatchOrderRequest, TransportRequestWithOrders } from '../order-confirmation/order.service';
import { environment } from 'src/environments/environment';

type PaymentMode = 'simulated' | 'gateway';

const DEFAULT_TRANSPORT_REQUEST_LEAD_MINUTES = 245;

interface PaymentNavigationState {
  orderData?: any;
  checkoutSessionId?: number;
  hasTransport?: boolean;
  transportData?: any;
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
  checkoutSessionId: number | null = null;
  selectedPaymentMethod: string = '';
  isProcessingPayment: boolean = false;
  loadingPaymentMethods: boolean = true;
  paymentContextError: string | null = null;
  checkoutPaymentStatus: string | null = null;
  checkoutCanResumePayment: boolean = false;
  checkoutCanRetryPayment: boolean = true;
  checkoutRetryBlockReason: string | null = null;
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
    private location: Location,
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
      timeOutline,
      walletOutline,
      cashOutline,
      businessOutline
    });

    const navigation = this.router.getCurrentNavigation();
    const navigationState = navigation?.extras?.state as Partial<PaymentNavigationState> | undefined;
    this.orderData = navigationState?.orderData;
    this.checkoutSessionId = navigationState?.checkoutSessionId ?? this.orderData?.checkoutSessionId ?? null;

    if (!this.orderData && !this.checkoutSessionId) {
      console.error('No order data found in navigation state');
      this.router.navigate(['/buyer/cart']);
      return;
    }

    // Always ensure items are properly populated from wholesalerGroups
    if (this.orderData && this.orderData.wholesalerGroups) {
      this.ensureItemsPopulated();
    }

    // Extract transport information
    this.hasTransport = this.orderData?.hasTransport || navigationState?.hasTransport || false;
    this.transportInfo = this.orderData?.transportData || navigationState?.transportData;

    console.log('Payment page initialized with order data:', this.orderData);
    console.log('Checkout session ID:', this.checkoutSessionId);
    console.log('Has transport:', this.hasTransport);
    console.log('Transport info:', this.transportInfo);
  }

  async ngOnInit() {
    await this.initializePaymentContext();
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

  private ensureItemsPopulated(): void {
    if (!this.orderData || !this.orderData.wholesalerGroups) {
      return;
    }

    // Extract items from wholesalerGroups and ensure each item has valid price data
    const items = this.orderData.wholesalerGroups.reduce((allItems: any[], group: any) => {
      return allItems.concat(
        (group.items || []).map((item: any) => ({
          ...item,
          // Ensure latest_wholesaler_price is set from available sources
          latest_wholesaler_price: item.latest_wholesaler_price ?? item.price ?? 0,
          price: item.price ?? item.latest_wholesaler_price ?? 0
        }))
      );
    }, []);

    // Only update if items have valid prices or if no items exist
    if (items.length > 0 && (items.some((i: any) => i.latest_wholesaler_price > 0) || !this.orderData.items || this.orderData.items.length === 0)) {
      this.orderData.items = items;
    }
  }

  private async initializePaymentContext(): Promise<void> {
    try {
      if (this.checkoutSessionId) {
        await this.loadCheckoutSessionDetail(this.checkoutSessionId);
      } else if (this.orderData) {
        await this.ensureCheckoutSession();
      }
    } catch (error: any) {
      console.error('Failed to initialize payment context:', error);
      this.paymentContextError = error?.message || this.translate.instant('PAYMENT.PAYMENT_ERROR_MSG');
      await this.showPaymentError(this.paymentContextError ?? undefined);
    } finally {
      this.loadingPaymentMethods = false;
    }
  }

  private async createTransportJob(orderIds: number[], transportData: any): Promise<void> {
    try {
      const requestedDate = this.resolveTransportRequestedDate(transportData);
      const transportRequest: TransportRequestWithOrders = {
        distance: transportData.distance || 50,
        delivery_type: transportData.delivery_type,
        urgency: transportData.urgency || null,
        requested_date: requestedDate,
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

  private resolveTransportRequestedDate(transportData: any): Date {
    const minimumRequestedDate = this.buildDefaultTransportRequestedDate();
    const rawRequestedDate = transportData?.requested_date;
    if (rawRequestedDate) {
      const parsedDate = new Date(rawRequestedDate);
      if (!Number.isNaN(parsedDate.getTime()) && parsedDate.getTime() >= minimumRequestedDate.getTime()) {
        return parsedDate;
      }
    }

    return minimumRequestedDate;
  }

  private buildDefaultTransportRequestedDate(): Date {
    const requestedDate = new Date();
    requestedDate.setMinutes(requestedDate.getMinutes() + DEFAULT_TRANSPORT_REQUEST_LEAD_MINUTES);
    return requestedDate;
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

    if (!this.canProcessCheckoutPayment()) {
      await this.showPaymentError(this.checkoutRetryBlockReason || this.translate.instant('PAYMENT.PAYMENT_ERROR_MSG'));
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
      await this.ensureCheckoutSession();
      if (!this.checkoutSessionId) {
        throw new Error(this.translate.instant('PAYMENT.ERROR_ORDER_CREATION'));
      }

      // FIX: Use ?? (nullish coalescing) instead of || (logical OR) so that a legitimate
      // numeric 0 does not incorrectly fall through to the next fallback. Also add
      // transporterCost as a last-resort fallback before defaulting to 0.
      const payableAmount = Number(
        this.orderData?.payableAmount
          ?? this.orderData?.grandTotal
          ?? this.orderData?.totalPrice
          ?? 0
      );

      console.log('Payment initiation - payableAmount:', payableAmount, 'orderData:', {
        payableAmount: this.orderData?.payableAmount,
        grandTotal: this.orderData?.grandTotal,
        totalPrice: this.orderData?.totalPrice,
      });

      // Guard: ensure we have a valid positive amount before calling the gateway.
      // Previously, when payableAmount resolved to 0 (e.g. because orderData fields were
      // null/undefined after loadCheckoutSessionDetail), the service omitted the `amount`
      // field from the request body entirely, causing the gateway to respond with:
      // "invalid callback amount "": amount is required"
      if (!payableAmount || payableAmount <= 0) {
        throw new Error(this.translate.instant('PAYMENT.ERROR_INVALID_AMOUNT'));
      }

      const response = await this.paymentService.initiatePayment(
        this.checkoutSessionId,
        this.selectedPaymentMethod,
        payableAmount
      ).toPromise();

      await loading.dismiss();

      if (response?.data?.payment_url && response?.data?.order_id) {
        const paymentUrl = this.gatewayUrlForBrowser(response.data.payment_url);
        const paymentOrderId = response.data.order_id;

        // We need the returned window handle here to distinguish a real popup block
        // from a successful gateway launch. Using noopener/noreferrer can return null
        // even when the popup opens, which breaks the gateway flow.
        const paymentWindow = window.open(paymentUrl, '_blank');
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

  private gatewayUrlForBrowser(rawUrl: string): string {
    const gatewayBase = environment.paymentGatewayUrl?.trim();

    let paymentUrl: URL;
    try {
      paymentUrl = new URL(rawUrl, gatewayBase || window.location.origin);
    } catch {
      return rawUrl;
    }

    if (!this.isLoopbackGatewayHost(paymentUrl.hostname)) {
      return paymentUrl.toString();
    }

    if (!gatewayBase) {
      return rawUrl;
    }

    try {
      const baseUrl = new URL(gatewayBase);
      paymentUrl.protocol = baseUrl.protocol;
      paymentUrl.host = baseUrl.host;
      return paymentUrl.toString();
    } catch {
      return rawUrl;
    }
  }

  private isLoopbackGatewayHost(hostname: string): boolean {
    const host = hostname.toLowerCase();
    return host === 'localhost' ||
      host === '0.0.0.0' ||
      host === '127.0.0.1' ||
      host.startsWith('127.') ||
      host === '::1' ||
      host === '[::1]';
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

        const rawStatus = statusResponse?.data?.status ?? '';
        const paymentStatus = rawStatus.toLowerCase();
        const failureReason = statusResponse?.data?.failure_reason || undefined;

        if (paymentStatus === 'success') {
          const orderIds = statusResponse?.data?.order_ids ?? [];
          if (!orderIds.length) {
            return;
          }

          this.clearPolling();
          await pollingLoading.dismiss();

          const updatedOrderData = {
            ...this.orderData,
            checkoutSessionId: this.checkoutSessionId,
            orderIds,
            orderId: orderIds[0],
            ordersTotal: this.orderData?.wholesalerGroups?.reduce((sum: number, group: any) => sum + (group?.finalAmount ?? 0), 0)
              ?? this.orderData?.grandTotal
              ?? 0,
            deliveryCost: this.orderData?.transporterCost ?? 0,
            grandTotal: this.orderData?.grandTotal ?? 0,
          };
          this.orderData = updatedOrderData;

          if (this.hasTransport && this.transportInfo) {
            await this.createTransportJob(orderIds, this.transportInfo);
          }

          await this.showToast(
            this.translate.instant('PAYMENT.PAYMENT_SUCCESS'),
            'success'
          );

          this.navigateToOrderConfirmation(updatedOrderData);
        } else if (paymentStatus === 'failed' || paymentStatus === 'failure' || paymentStatus === 'cancelled') {
          this.clearPolling();
          await pollingLoading.dismiss();
          await this.showPaymentError(
            failureReason || this.translate.instant('PAYMENT.PAYMENT_FAILED_MSG')
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

  private buildCheckoutSessionRequest(orderData: any): CreateBatchOrderRequest {
    const orderGroups = orderData.wholesalerGroups.map((group: any) => ({
      wholeseller_id: group.wholesalerId,
      branch_id: group.branchId,
      items: group.items.map((item: any) => ({
        selected_id: item.selected_id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_id: item.unit_id,
        price: this.firstPositivePrice(item.price, item.latest_wholesaler_price, item.price_while_added),
        discount_amount: item.discount_amount ?? 0,
        tax_amount: item.tax_amount ?? 0,
        wholeseller_id: group.wholesalerId,
        branch_id: group.branchId,
        product_name: item.product_name || item.name || '',
        unit_name: item.unit_name || '',
      })),
      total_order_amount: group.subtotal,
      discount_amount: group.allocatedDiscount ?? 0,
      tax_amount: group.allocatedTax ?? 0,
      final_amount: group.finalAmount,
    }));

    return {
      date_of_order: new Date().toISOString(),
      order_status: 1,
      delivery_address: orderData.deliveryAddress,
      retailer_branch_id: orderData.retailerBranchId,
      order_groups: orderGroups,
      delivery_amount: orderData.transporterCost ?? 0,
      checkout_session_id: orderData.checkoutSessionId ?? this.checkoutSessionId ?? undefined,
    };
  }

  private firstPositivePrice(...values: unknown[]): number {
    for (const value of values) {
      const numericValue = Number(value);
      if (Number.isFinite(numericValue) && numericValue > 0) {
        return numericValue;
      }
    }
    return 0;
  }

  private async ensureCheckoutSession(): Promise<void> {
    if (this.checkoutSessionId) {
      return;
    }
    if (!this.orderData) {
      throw new Error(this.translate.instant('PAYMENT.ERROR_NO_ITEMS'));
    }

    const response = await this.paymentService
      .createCheckoutSession(this.buildCheckoutSessionRequest(this.orderData))
      .toPromise();

    const checkoutSessionId = response?.data?.checkout_session_id;
    if (!checkoutSessionId) {
      throw new Error(this.translate.instant('PAYMENT.ERROR_ORDER_CREATION'));
    }

    this.checkoutSessionId = checkoutSessionId;
    this.orderData = {
      ...this.orderData,
      checkoutSessionId,
      totalPrice: response?.data?.goods_amount ?? this.orderData?.totalPrice ?? 0,
      transporterCost: response?.data?.delivery_amount ?? this.orderData?.transporterCost ?? 0,
      platformFeeAmount: response?.data?.platform_fee_amount ?? this.orderData?.platformFeeAmount ?? 0,
      handlingChargeAmount: response?.data?.handling_charge_amount ?? this.orderData?.handlingChargeAmount ?? 0,
      // FIX: Use ?? instead of || so a valid 0 amount is not silently skipped
      payableAmount: response?.data?.payable_amount ?? this.orderData?.payableAmount ?? this.orderData?.grandTotal ?? 0,
      grandTotal: response?.data?.payable_amount ?? this.orderData?.grandTotal ?? 0,
      // Preserve the items array if it exists
      items: this.orderData?.items || [],
    };

    console.log('Checkout session created:', {
      checkoutSessionId,
      payableAmount: this.orderData.payableAmount,
      responseData: response?.data
    });
  }

  private async loadCheckoutSessionDetail(checkoutSessionId: number): Promise<void> {
    const existingTransportInfo = this.transportInfo;
    const response = await this.paymentService.getCheckoutSession(checkoutSessionId).toPromise();
    const detail = response?.data;
    if (!detail) {
      throw new Error(this.translate.instant('PAYMENT.ERROR_ORDER_CREATION'));
    }

    this.checkoutSessionId = detail.checkout_session_id;
    this.checkoutPaymentStatus = detail.status;
    this.checkoutCanResumePayment = detail.can_resume_payment;
    this.checkoutCanRetryPayment = detail.can_retry_payment;
    this.checkoutRetryBlockReason = detail.retry_block_reason || null;
    this.orderData = this.mapCheckoutSessionDetailToOrderData(detail);

    console.log('Checkout session loaded:', {
      checkoutSessionId: detail.checkout_session_id,
      payableAmount: detail.payable_amount,
      status: detail.status,
      orderData: this.orderData
    });

    // Ensure items have correct prices from wholesalerGroups
    this.ensureItemsPopulated();

    this.hasTransport = (detail.delivery_amount ?? 0) > 0;
    this.transportInfo = this.hasTransport
      ? {
          base_price: detail.delivery_amount,
          delivery_type: existingTransportInfo?.delivery_type || 'standard',
          urgency: existingTransportInfo?.urgency || 'standard',
          distance: existingTransportInfo?.distance || 0,
          distance_km: existingTransportInfo?.distance_km || existingTransportInfo?.distance || 0,
          requested_date: existingTransportInfo?.requested_date || this.resolveTransportRequestedDate(existingTransportInfo).toISOString(),
          load_type: existingTransportInfo?.load_type || 'general',
        }
      : null;
  }

  private mapCheckoutSessionDetailToOrderData(detail: CheckoutSessionDetailResponse['data']): any {
    const wholesalerGroups = detail.order_groups.map((group) => ({
      wholesalerId: group.wholeseller_id,
      branchId: group.branch_id ?? 0,
      wholesalerName: '',
      branchName: '',
      itemCount: group.items.length,
      subtotal: group.total_order_amount,
      allocatedDiscount: group.discount_amount,
      allocatedTax: group.tax_amount,
      finalAmount: group.final_amount,
      items: group.items.map((item) => ({
        selected_id: item.selected_id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_id: item.unit_id,
        unit_name: item.unit_name,
        price: item.price,
        latest_wholesaler_price: item.price,
        tax_amount: item.tax_amount,
        discount_amount: item.discount_amount,
        wholeseller_id: item.wholeseller_id,
        branch_id: item.branch_id,
      })),
    }));
    const items = wholesalerGroups.reduce((allItems: any[], group: any) => {
      return allItems.concat(group.items);
    }, []);

    return {
      checkoutSessionId: detail.checkout_session_id,
      checkoutStatus: detail.status,
      items,
      wholesalerGroups,
      selectedBranch: {
        branch_id: detail.retailer_branch_id,
        address: detail.delivery_address,
        location_verification_status: 'verified',
      },
      deliveryAddress: detail.delivery_address,
      totalPrice: detail.goods_amount,
      discount: wholesalerGroups.reduce((sum: number, group: any) => sum + (group.allocatedDiscount || 0), 0),
      platformFeeAmount: detail.platform_fee_amount,
      handlingChargeAmount: detail.handling_charge_amount,
      // FIX: Explicitly coerce to Number so downstream arithmetic never sees null/undefined.
      // This is the root source of the "invalid callback amount" error — if the API returns
      // payable_amount as null or undefined, all downstream reads of orderData.payableAmount
      // produce NaN or undefined, which causes initiatePayment to omit the amount field entirely.
      payableAmount: Number(detail.payable_amount ?? 0),
      grandTotal: Number(detail.payable_amount ?? 0),
      hasTransport: detail.delivery_amount > 0,
      transportData: detail.delivery_amount > 0
        ? { base_price: detail.delivery_amount, requested_date: this.resolveTransportRequestedDate(null).toISOString() }
        : null,
      transporterCost: detail.delivery_amount,
      retailerBranchId: detail.retailer_branch_id,
    };
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

    this.location.back();
  }

  canProcessCheckoutPayment(): boolean {
    if (!this.checkoutSessionId || !this.checkoutPaymentStatus) {
      return true;
    }

    if (this.checkoutPaymentStatus === 'cancelled' || this.checkoutPaymentStatus === 'materialized' || this.checkoutPaymentStatus === 'payment_captured') {
      return false;
    }

    if (this.checkoutPaymentStatus === 'payment_failed' || this.checkoutPaymentStatus === 'payment_expired') {
      return this.checkoutCanRetryPayment;
    }

    if (this.checkoutPaymentStatus === 'created' || this.checkoutPaymentStatus === 'payment_pending') {
      return true;
    }

    return true;
  }
}
