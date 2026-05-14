import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  chevronBack,
  locationOutline,
  addOutline,
  checkmark,
  callOutline,
  mailOutline,
  receiptOutline,
  personOutline,
  storefrontOutline,
  bagOutline,
  carOutline,
  bicycleOutline,
  rocketOutline,
  navigateOutline,
  cashOutline,
  informationCircleOutline,
  calculatorOutline,
  arrowForwardOutline
} from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, firstValueFrom } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { CheckoutService, BusinessBranch } from './checkout.service';
import { CheckoutSessionService, CreateCheckoutSessionRequest } from '../services/checkout-session.service';
import { AuthService } from 'src/app/auth/auth.service';
import { BuyerApiService } from '../services/buyer-api.service';

type TransportType = 'standard' | 'express' | 'priority';

interface CartItem {
  selected_id?: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_id: number;
  unit_name: string;
  price_while_added: number;
  latest_wholesaler_price: number;
  price_updated_at?: string;
  is_active: boolean;
  branch_id?: number;
  wholesaler_id?: number;
  wholesaler_name?: string;
}

interface RetailerInfo {
  id: number;
  name?: string;
  address?: string;
  state?: string;
  location?: string;
}

interface WholeSeller {
  id: number;
  name?: string;
  latitude?: number;
  longitude?: number;
}

interface WholesalerGroupSummary {
  wholesalerId: number;
  branchId: number;
  wholesalerName: string;
  branchName: string;
  itemCount: number;
  subtotal: number;
  items: CartItem[];
  allocatedDiscount: number;
  allocatedTax: number;
  finalAmount: number;
}

interface TransportData {
  delivery_type: TransportType;
  urgency: 'low' | 'standard' | 'high';
  base_price: number;
  distance: number;
  distance_km: number;
  requested_date: string;
  load_type: string;
  status: string;
}

const DEFAULT_TRANSPORT_REQUEST_LEAD_MINUTES = 245;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  retailerInfo: RetailerInfo | null = null;
  wholeSeller: WholeSeller | null = null;
  wholesalerGroups: WholesalerGroupSummary[] = [];

  totalPrice = 0;
  discount = 0;

  // Checkout preview mirrors the current backend policy:
  // retailer pays only their own commission share; wholeseller and transporter
  // deductions stay backend-side and do not change retailer payable.
  handlingCharges = 0;
  platformFee = 0;

  grandTotal = 0;

  businessBranches: BusinessBranch[] = [];
  selectedBranch: BusinessBranch | null = null;
  isLoadingBranches = false;

  hasRideRequest = false;
  selectedDeliveryType: TransportType | null = null;
  estimatedRidePrice = 0;
  distance = 0;
  isLoadingDistance = false;
  isLoadingQuote = false;
  isPremiumUser = false;

  isLoading = false;

  private transportData: TransportData | null = null;
  private paymentInProgress = false;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    private loadingController: LoadingController,
    private checkoutService: CheckoutService,
    private authService: AuthService,
    private translate: TranslateService,
    private buyerApiService: BuyerApiService,
    private checkoutSessionService: CheckoutSessionService
  ) {
    addIcons({
      chevronBack,
      locationOutline,
      addOutline,
      checkmark,
      callOutline,
      mailOutline,
      receiptOutline,
      personOutline,
      storefrontOutline,
      bagOutline,
      carOutline,
      bicycleOutline,
      rocketOutline,
      navigateOutline,
      cashOutline,
      informationCircleOutline,
      calculatorOutline,
      arrowForwardOutline
    });

    this.handleNavigationState();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => this.handleNavigationState());
  }

  ngOnInit(): void {
    void this.checkAuthAndLoadBranches();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleNavigationState(): void {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state || history.state;

    if (!state || Object.keys(state).length <= 1) {
      return;
    }

    const navigationCartItems = state['cartItems'] || [];
    const navigationGroups = state['wholesalerGroups'] || [];

    if (navigationCartItems.length > 0 || navigationGroups.length > 0) {
      const sourceItems = navigationCartItems.length > 0
        ? navigationCartItems
        : navigationGroups.flatMap((group: any) => group.items || []);

      this.cartItems = sourceItems.map((item: any) => {
        const price = this.firstPositivePrice(
          item.price_while_added,
          item.latest_wholesaler_price,
          item.price
        );
        return {
          selected_id: item.selected_id,
          product_id: item.product_id,
          product_name: item.product_name || item.name,
          quantity: item.quantity,
          unit_id: item.unit_id,
          unit_name: item.unit_name,
          price_while_added: price,
          latest_wholesaler_price: price,
          price_updated_at: item.price_updated_at,
          is_active: !item.is_deleted
        } as CartItem;
      });

      this.wholesalerGroups = navigationGroups;
      this.totalPrice = state['totalPrice'] ||
        this.wholesalerGroups.reduce((sum, group) => sum + (group.subtotal || 0), 0);
      this.retailerInfo = state['retailer'] || null;
      this.wholeSeller = state['wholeseller'] || null;
      this.discount = state['discount'] || 0;
    }

    if (state['hasRideRequest'] !== undefined || state['hasTransport'] !== undefined) {
      this.hasRideRequest = state['hasRideRequest'] || state['hasTransport'] || false;
    }

    if (state['transportData']) {
      this.transportData = state['transportData'];
      this.selectedDeliveryType = this.transportData?.delivery_type || null;
      this.estimatedRidePrice = this.transportData?.base_price || 0;
      this.distance = this.transportData?.distance_km || this.transportData?.distance || 0;
    }

    if (state['selectedBranch']) {
      this.selectedBranch = state['selectedBranch'];
    }

    this.calculateGroupPricing();
  }

  private async checkAuthAndLoadBranches(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      await this.showAuthError();
      return;
    }

    if (!this.authService.hasRole('retailer')) {
      await this.showUnauthorizedError();
      return;
    }

    await this.loadBusinessBranches();
  }

  private async loadBusinessBranches(): Promise<void> {
    this.isLoadingBranches = true;
    const loading = await this.loadingController.create({
      message: this.translate.instant('CHECKOUT.LOADING_BRANCHES')
    });
    await loading.present();

    try {
      const userId = this.authService.getUserId();
      if (!userId) {
        await this.showAuthError();
        return;
      }

      const branches = await firstValueFrom(
        this.checkoutService.getAllBusinessBranches().pipe(takeUntil(this.destroy$))
      );

      this.businessBranches = branches?.filter(branch => branch.active_status) || [];

      if (this.businessBranches.length > 0 && !this.selectedBranch) {
        this.selectedBranch =
          this.businessBranches.find(branch => this.isBranchVerified(branch)) ||
          this.businessBranches[0];
      }

      if (this.hasRideRequest && this.selectedBranch) {
        this.tryCalculateDistance();
      }
    } catch (error: any) {
      if (error?.status === 401) {
        await this.showAuthError();
      } else {
        await this.showErrorAlert(this.getErrorMessage(error));
      }
    } finally {
      this.isLoadingBranches = false;
      await loading.dismiss().catch(() => undefined);
    }
  }

  selectBranch(branch: BusinessBranch): void {
    this.selectedBranch = branch;

    if (this.hasRideRequest) {
      this.tryCalculateDistance();
    }

    this.calculateGroupPricing();
  }

  trackByBranchId(_: number, branch: BusinessBranch): number {
    return branch.branch_id;
  }

  addNewAddress(): void {
    this.router.navigate(['/buyer/add-business-location']);
  }

  onTransportToggle(): void {
    if (this.hasRideRequest) {
      if (!this.selectedBranch) {
        this.hasRideRequest = false;
        void this.showErrorAlert(this.translate.instant('CHECKOUT.SELECT_ADDRESS_FIRST'));
        return;
      }

      if (!this.isBranchVerified(this.selectedBranch)) {
        this.hasRideRequest = false;
        void this.showErrorAlert(this.translate.instant('CHECKOUT.BRANCH_VERIFICATION_REQUIRED_MESSAGE'));
        return;
      }

      if (!this.selectedDeliveryType) {
        this.selectedDeliveryType = 'standard';
      }

      this.tryCalculateDistance();
      return;
    }

    this.estimatedRidePrice = 0;
    this.calculateGroupPricing();
  }

  async selectTransportType(type: TransportType): Promise<void> {
    if (type === 'priority' && !this.isPremiumUser) {
      await this.showPremiumUpgradeAlert();
      return;
    }

    this.selectedDeliveryType = type;
    await this.refreshPriceQuote();
  }

  getSelectedDeliveryTypeKey(): string {
    if (this.selectedDeliveryType === 'express') {
      return 'RIDE.EXPRESS_DELIVERY';
    }

    if (this.selectedDeliveryType === 'priority') {
      return 'RIDE.PRIORITY_DELIVERY';
    }

    return 'RIDE.STANDARD_DELIVERY';
  }

  async proceedToPayment(): Promise<void> {
    if (this.paymentInProgress) {
      return;
    }

    if (!this.selectedBranch) {
      void this.showErrorAlert(this.translate.instant('CHECKOUT.SELECT_ADDRESS_FIRST'));
      return;
    }

    if (!this.isBranchVerified(this.selectedBranch)) {
      void this.showErrorAlert(this.translate.instant('CHECKOUT.BRANCH_VERIFICATION_REQUIRED_MESSAGE'));
      return;
    }

    if (this.wholesalerGroups.length === 0) {
      void this.showErrorAlert(this.translate.instant('CHECKOUT.NO_ITEMS_ERROR'));
      return;
    }

    this.paymentInProgress = true;
    this.isLoading = true;
    this.calculateGroupPricing();

    const finalTransportData: TransportData | null = this.hasRideRequest && this.selectedDeliveryType
      ? {
          delivery_type: this.selectedDeliveryType,
          urgency: this.selectedDeliveryType === 'priority' ? 'high' : 'standard',
          base_price: this.estimatedRidePrice,
          distance: this.distance,
          distance_km: this.distance,
          requested_date: this.buildDefaultTransportRequestedDate(),
          load_type: 'general',
          status: 'pending'
        }
      : null;

    try {
      const orderGroups = this.wholesalerGroups.map(group => ({
        wholeseller_id: group.wholesalerId,
        branch_id: group.branchId,
        items: (group.items || []).map(item => ({
          selected_id: item.selected_id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_id: item.unit_id,
          unit_name: item.unit_name,
          price: this.firstPositivePrice(item.price_while_added, item.latest_wholesaler_price),
          discount_amount: 0,
          tax_amount: 0,
          wholeseller_id: group.wholesalerId,
          branch_id: group.branchId,
        })),
        total_order_amount: group.subtotal,
        discount_amount: group.allocatedDiscount ?? 0,
        tax_amount: group.allocatedTax ?? 0,
        final_amount: group.finalAmount,
      }));

      const checkoutRequest: CreateCheckoutSessionRequest = {
        date_of_order: new Date().toISOString().split('T')[0],
        delivery_address: this.selectedBranch.address || '',
        retailer_branch_id: this.selectedBranch.branch_id,
        order_groups: orderGroups,
        delivery_amount: this.getTransportCostForCheckout(),
      };

      const checkoutResponse = await firstValueFrom(
        this.checkoutSessionService.createCheckoutSession(checkoutRequest)
          .pipe(takeUntil(this.destroy$))
      );

      const checkoutSessionId = checkoutResponse?.data?.checkout_session_id;
      if (!checkoutSessionId) {
        throw new Error(this.translate.instant('CHECKOUT.CHECKOUT_SESSION_ERROR'));
      }

      this.router.navigate(['/buyer/payment'], {
        state: {
          orderData: {
            wholesalerGroups: this.wholesalerGroups,
            selectedBranch: this.selectedBranch,
            deliveryAddress: this.selectedBranch.address || '',
            deliveryPincode: this.selectedBranch.pincode || '',
            totalPrice: checkoutResponse?.data?.goods_amount ?? this.totalPrice,
            discount: this.discount,
            platformFeeAmount: checkoutResponse?.data?.platform_fee_amount ?? this.platformFee,
            handlingChargeAmount: checkoutResponse?.data?.handling_charge_amount ?? this.handlingCharges,
            payableAmount: checkoutResponse?.data?.payable_amount ?? this.grandTotal,
            grandTotal: checkoutResponse?.data?.payable_amount ?? this.grandTotal,
            hasTransport: this.hasRideRequest,
            transportData: finalTransportData,
            transporterCost: checkoutResponse?.data?.delivery_amount ?? (this.hasRideRequest ? this.estimatedRidePrice : 0),
            retailer: this.retailerInfo,
            retailerBranchId: this.selectedBranch.branch_id,
            checkoutSessionId: checkoutSessionId
          }
        }
      });
    } catch (error: any) {
      const errorMessage = error?.message || this.translate.instant('CHECKOUT.CHECKOUT_SESSION_ERROR');
      void this.showErrorAlert(errorMessage);
    } finally {
      this.paymentInProgress = false;
      this.isLoading = false;
    }
  }

  private getTransportCostForCheckout(): number {
    return this.hasRideRequest ? this.estimatedRidePrice : 0;
  }

  private buildDefaultTransportRequestedDate(): string {
    const requestedAt = new Date();
    requestedAt.setMinutes(requestedAt.getMinutes() + DEFAULT_TRANSPORT_REQUEST_LEAD_MINUTES);
    return requestedAt.toISOString();
  }

  goBack(): void {
    this.router.navigate(['/buyer/cart']);
  }

  getRetailerInfo(): string {
    if (!this.retailerInfo) {
      return this.translate.instant('CHECKOUT.UNKNOWN_RETAILER');
    }

    return `${this.retailerInfo.name || this.translate.instant('CHECKOUT.UNKNOWN')} - ${this.retailerInfo.location || this.translate.instant('CHECKOUT.UNKNOWN_LOCATION')}`;
  }

  getWholesellerInfo(): string {
    if (this.wholesalerGroups.length === 1) {
      return this.wholesalerGroups[0].wholesalerName;
    }

    if (this.wholesalerGroups.length > 1) {
      return `${this.wholesalerGroups.length} ${this.translate.instant('CHECKOUT.WHOLESALERS')}`;
    }

    if (!this.wholeSeller) {
      return this.translate.instant('CHECKOUT.DIRECT_ORDER');
    }

    return this.wholeSeller.name || this.translate.instant('CHECKOUT.UNKNOWN_WHOLESELLER');
  }

  private isBranchVerified(branch: BusinessBranch | null | undefined): boolean {
    return !!branch && branch.location_verification_status === 'verified';
  }

  private tryCalculateDistance(): void {
    const pickupLat = this.wholeSeller?.latitude;
    const pickupLon = this.wholeSeller?.longitude;
    const dropLat = this.selectedBranch?.latitude;
    const dropLon = this.selectedBranch?.longitude;

    if (pickupLat && pickupLon && dropLat && dropLon) {
      this.isLoadingDistance = true;
      this.buyerApiService.getRouteMetrics(pickupLat, pickupLon, dropLat, dropLon)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: res => {
            this.distance = Math.round((res.distance_meters / 1000) * 100) / 100;
            this.isLoadingDistance = false;
            void this.refreshPriceQuote();
          },
          error: () => {
            this.distance = this.fallbackDistance();
            this.isLoadingDistance = false;
            void this.refreshPriceQuote();
          }
        });
      return;
    }

    if (this.distance <= 0) {
      this.distance = this.fallbackDistance();
    }

    void this.refreshPriceQuote();
  }

  private fallbackDistance(): number {
    return Math.floor(Math.random() * 46) + 5;
  }

  private async refreshPriceQuote(): Promise<void> {
    const branch = this.selectedBranch;
    if (!this.selectedDeliveryType || this.distance <= 0 || !branch?.city_shortname) {
      return;
    }

    this.isLoadingQuote = true;

    try {
      const totalWeight = this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const quote = await firstValueFrom(
        this.buyerApiService.calculateTransportPricePreview(
          this.distance,
          totalWeight,
          this.selectedDeliveryType,
          branch.city_shortname,
          branch.city_name || branch.city_shortname,
          'general'
        ).pipe(takeUntil(this.destroy$))
      );

      this.estimatedRidePrice = quote?.price || 0;
    } catch {
      this.estimatedRidePrice = 0;
    } finally {
      this.isLoadingQuote = false;
      this.calculateGroupPricing();
    }
  }

  private calculateGroupPricing(): void {
    if (this.wholesalerGroups.length === 0) {
      const goodsAmount = Math.max(this.totalPrice - this.discount, 0);
      this.applyPaymentQuote(goodsAmount);
      this.grandTotal = goodsAmount + this.platformFee +
        (this.hasRideRequest ? this.estimatedRidePrice : 0);
      return;
    }

    const totalSubtotal = this.wholesalerGroups.reduce((sum, group) => sum + group.subtotal, 0);

    for (const group of this.wholesalerGroups) {
      const proportion = totalSubtotal > 0 ? group.subtotal / totalSubtotal : 0;
      group.allocatedDiscount = Math.round(this.discount * proportion * 100) / 100;
      group.allocatedTax = 0;
      group.finalAmount = group.subtotal - group.allocatedDiscount + group.allocatedTax;
    }

    const ordersTotal = this.wholesalerGroups.reduce((sum, group) => sum + group.finalAmount, 0);
    this.applyPaymentQuote(ordersTotal);
    this.grandTotal = ordersTotal + this.platformFee +
      (this.hasRideRequest ? this.estimatedRidePrice : 0);
  }

  private applyPaymentQuote(goodsAmount: number): void {
    const normalizedGoodsAmount = Math.max(goodsAmount, 0);
    this.handlingCharges = 0;
    this.platformFee = this.calculateRetailerPlatformFeeShare(normalizedGoodsAmount);
  }

  private calculateRetailerPlatformFeeShare(goodsAmount: number): number {
    if (goodsAmount <= 0) {
      return 0;
    }

    let commissionRate = 0.0125;
    if (goodsAmount <= 5000) {
      commissionRate = 0.02;
    } else if (goodsAmount <= 10000) {
      commissionRate = 0.0175;
    } else if (goodsAmount <= 25000) {
      commissionRate = 0.015;
    }

    return Math.round(goodsAmount * commissionRate * 0.5 * 100) / 100;
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

  private async showPremiumUpgradeAlert(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RIDE.PREMIUM_REQUIRED_TITLE'),
      message: this.translate.instant('RIDE.PREMIUM_UPGRADE_MESSAGE'),
      buttons: [
        { text: this.translate.instant('COMMON.CANCEL'), role: 'cancel' },
        { text: this.translate.instant('RIDE.UPGRADE_NOW'), handler: () => undefined }
      ]
    });

    await alert.present();
  }

  private async showAuthError(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('CHECKOUT.AUTH_ERROR'),
      message: this.translate.instant('CHECKOUT.SESSION_EXPIRED'),
      buttons: [
        {
          text: this.translate.instant('CHECKOUT.OK'),
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });

    await alert.present();
  }

  private async showUnauthorizedError(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('CHECKOUT.ACCESS_DENIED'),
      message: this.translate.instant('CHECKOUT.NO_PERMISSION'),
      buttons: [
        {
          text: this.translate.instant('CHECKOUT.OK'),
          handler: () => this.router.navigate(['/login'])
        }
      ]
    });

    await alert.present();
  }

  private async showErrorAlert(message: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('CHECKOUT.ERROR'),
      message,
      buttons: [this.translate.instant('CHECKOUT.OK')]
    });

    await alert.present();
  }

  private getErrorMessage(error: any): string {
    if (!error) {
      return this.translate.instant('CHECKOUT.UNEXPECTED_ERROR');
    }

    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      return this.translate.instant('REQUEST_TIMEOUT_ERROR');
    }

    if (error.status === 0 || error.message?.includes('network')) {
      return this.translate.instant('NETWORK_ERROR');
    }

    if (error.status === 401) {
      return this.translate.instant('CHECKOUT.SESSION_EXPIRED');
    }

    if (error.status === 403) {
      return this.translate.instant('CHECKOUT.NO_PERMISSION');
    }

    if (error.status === 404) {
      return this.translate.instant('NOT_FOUND');
    }

    if (error.status === 429) {
      return this.translate.instant('RATE_LIMIT_ERROR');
    }

    if (error.status >= 500) {
      return this.translate.instant('SERVER_ERROR');
    }

    return this.translate.instant('CHECKOUT.UNEXPECTED_ERROR');
  }
}
