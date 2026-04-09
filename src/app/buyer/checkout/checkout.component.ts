import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  chevronBack,
  locationOutline,
  timeOutline,
  cardOutline,
  trashOutline,
  addOutline,
  checkmarkCircle,
  carOutline,
  calculatorOutline,
  receiptOutline,
  personOutline,
  storefrontOutline,
  bagOutline,
  rocketOutline,
  flashOutline,
  cashOutline,
  informationCircleOutline,
  settingsOutline,
  arrowForwardOutline,
  checkmark,
  callOutline,
  mailOutline
} from 'ionicons/icons';
import { DatabaseService } from '../../services/database.service';
import { CheckoutService, BusinessBranch } from './checkout.service';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslatePipe } from '@ngx-translate/core';
import { OrderService } from 'src/app/buyer/order-confirmation/order.service';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

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
  delivery_type: 'standard' | 'express' | 'priority';
  urgency: 'low' | 'standard' | 'high';
  base_price: number;
  distance: number;
  dropoff_location?: string;
  dropoff_city_id?: number;
  dropoff_branch_id?: number;
  load_type?: string;
}

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
  totalPrice: number = 0;
  estimatedDelivery: string = '3-5 Business Days';
  isLoading: boolean = false;

  selectedDeliveryType: string | null = null;
  selectedUrgency: string | null = null;
  estimatedRidePrice: number = 0;
  grandTotal: number = 0;
  hasRideRequest: boolean = false;

  businessBranches: BusinessBranch[] = [];
  selectedBranch: BusinessBranch | null = null;
  isLoadingBranches: boolean = false;
  discount: number = 0;

  transportData: TransportData | null = null;
  wholesalerGroups: WholesalerGroupSummary[] = [];

  private routerSubscription?: Subscription;
  private destroy$ = new Subject<void>();
  private paymentInProgress: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private alertCtrl: AlertController,
    private loadingController: LoadingController,
    private checkoutService: CheckoutService,
    private authService: AuthService,
    private translate: TranslateService,
    private orderService: OrderService
  ) {
    addIcons({
      chevronBack,
      locationOutline,
      timeOutline,
      cardOutline,
      trashOutline,
      addOutline,
      checkmarkCircle,
      carOutline,
      calculatorOutline,
      receiptOutline,
      personOutline,
      storefrontOutline,
      bagOutline,
      rocketOutline,
      flashOutline,
      cashOutline,
      informationCircleOutline,
      settingsOutline,
      arrowForwardOutline,
      checkmark,
      callOutline,
      mailOutline
    });

    this.handleNavigationState();

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.handleNavigationState();
      });
  }

  ngOnInit(): void {
    this.calculateRidePrice();
    this.checkAuthAndLoadBranches();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle navigation state from router
   * Extracts cart items, pricing, transport, and address information
   * from the navigation state and populates component properties
   */
  private handleNavigationState(): void {
    const navigation = this.router.getCurrentNavigation();
    const navData = navigation?.extras?.state;

    if (!navData) {
      return;
    }

    if (navData['cartItems']) {
      this.cartItems = (navData['cartItems'] || []).map((item: any) => {
        const price = item.price_while_added ?? item.price ?? 0;
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
        };
      });

      if (navData['wholesalerGroups']) {
        this.wholesalerGroups = navData['wholesalerGroups'];
      }

      this.totalPrice = navData['totalPrice'] || 0;
      this.retailerInfo = navData['retailer'] || null;
      this.wholeSeller = navData['wholeseller'] || null;
      this.discount = navData['discount'] || 0;
    }

    if (navData['transportData']) {
      this.transportData = navData['transportData'];
      this.hasRideRequest = navData['hasRideRequest'] || navData['hasTransport'] || false;

      if (this.transportData) {
        this.selectedDeliveryType = this.transportData.delivery_type;
        this.selectedUrgency = this.transportData.urgency;
        this.estimatedRidePrice = this.transportData.base_price;
      }
    }

    if (navData['selectedBranch']) {
      this.selectedBranch = navData['selectedBranch'];
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
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  async loadBusinessBranches(): Promise<void> {
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

      this.checkoutService.getAllBusinessBranches()
        .pipe(
          takeUntil(this.destroy$)
        )
        .subscribe({
        next: (branches: BusinessBranch[]) => {
          this.businessBranches = branches?.filter(branch => branch.active_status) || [];

          if (this.businessBranches.length > 0 && !this.selectedBranch) {
            this.selectedBranch =
              this.businessBranches.find(branch => this.isBranchVerified(branch)) ||
              this.businessBranches[0];
          }
        },
        error: async (error: any) => {
          if (error.status === 401) {
            await this.showAuthError();
            return;
          }

          const errorMessage = this.getErrorMessage(error);
          await this.showErrorAlert(errorMessage);
        },
        complete: () => {
          this.isLoadingBranches = false;
          loading.dismiss();
        }
      });
    } catch (error) {
      this.isLoadingBranches = false;
      await loading.dismiss();
      await this.showErrorAlert(
        this.translate.instant('CHECKOUT.UNEXPECTED_ERROR')
      );
    }
  }

  selectBranch(branch: BusinessBranch): void {
    this.selectedBranch = branch;
    this.calculateRidePrice();
  }

  private isBranchVerified(branch: BusinessBranch | null | undefined): boolean {
    return !!branch && branch.location_verification_status === 'verified';
  }

  private showBranchVerificationRequired(): void {
    this.showErrorAlert(this.translate.instant('CHECKOUT.BRANCH_VERIFICATION_REQUIRED_MESSAGE'));
  }

  addNewAddress(): void {
    this.showInfoAlert(
      this.translate.instant('CHECKOUT.ADD_NEW_ADDRESS'),
      this.translate.instant('CHECKOUT.ADD_NEW_ADDRESS_MSG')
    );
  }

  trackByBranchId(index: number, branch: BusinessBranch): number {
    return branch.branch_id;
  }

  /**
   * Allocates discount and calculates final prices for each wholesaler group
   * Uses proportional allocation based on each group's subtotal
   *
   * Calculation: If group subtotal is 40% of total, gets 40% of discount
   * Final amount = subtotal - allocatedDiscount + tax
   * Grand total = sum of all group finals + transport cost
   */
  private calculateGroupPricing(): void {
    if (this.wholesalerGroups.length === 0) {
      this.grandTotal = this.totalPrice - this.discount + this.estimatedRidePrice;
      return;
    }

    // Total subtotal across all groups for proportional allocation
    const totalSubtotal = this.wholesalerGroups.reduce((sum, g) => sum + g.subtotal, 0);

    // Allocate discount proportionally to each group
    for (const group of this.wholesalerGroups) {
      const proportion = totalSubtotal > 0 ? group.subtotal / totalSubtotal : 0;

      // Allocate discount based on proportion of subtotal
      group.allocatedDiscount = Math.round(this.discount * proportion * 100) / 100;

      // Tax calculation (adjust based on your tax rules)
      group.allocatedTax = 0;  // TODO: implement tax logic if needed

      // Final amount for this group's order (no delivery in per-order amounts)
      group.finalAmount = group.subtotal - group.allocatedDiscount + group.allocatedTax;
    }

    // Grand total = sum of all order finals + transport cost
    const ordersTotal = this.wholesalerGroups.reduce((sum, g) => sum + g.finalAmount, 0);
    this.grandTotal = ordersTotal + this.estimatedRidePrice;
  }

  /**
   * Calculates estimated ride price based on transport type and distance
   *
   * Rates per km:
   * - Standard: ₹8/km
   * - Express: ₹15/km
   * - Priority: ₹25/km
   *
   * Minimum charge: ₹50
   * Final price = Math.max(50, rate * distance)
   */
  calculateRidePrice(): void {
    this.estimatedRidePrice = this.hasRideRequest ? (this.transportData?.base_price || 0) : 0;

    this.calculateGroupPricing();
  }

  /**
   * Navigate to transport arrangement screen with current checkout context
   * Validates that a branch is selected before allowing navigation
   */
  arrangeRide(): void {
    if (!this.selectedBranch) {
      this.showErrorAlert(this.translate.instant('CHECKOUT.SELECT_ADDRESS_FIRST'));
      return;
    }
    if (!this.isBranchVerified(this.selectedBranch)) {
      this.showBranchVerificationRequired();
      return;
    }

    const totalWeight = this.calculateTotalWeight();

    this.router.navigate(['/buyer/ride'], {
      state: {
        totalWeight: totalWeight,
        pickup: this.selectedBranch.address || this.selectedBranch.city_name,
        delivery: 'Destination',
        pickupCityId: this.selectedBranch.city_id,
        pickupBranchId: this.selectedBranch.branch_id,
        cartItems: this.cartItems,
        totalPrice: this.totalPrice,
        discount: this.discount,
        retailer: this.retailerInfo,
        wholeseller: this.wholeSeller,
        selectedBranch: this.selectedBranch,
        transportData: this.transportData,
        hasTransport: this.hasRideRequest,
        wholesalerGroups: this.wholesalerGroups,
      }
    });
  }

  private calculateTotalWeight(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  private getDistance(): number {
    // TODO: Implement proper distance calculation based on pickup and delivery locations
    return 50; // Default 50 km
  }

  proceedToPayment(): void {
    // Prevent double-click
    if (this.paymentInProgress) {
      return;
    }

    if (!this.selectedBranch) {
      this.showErrorAlert(this.translate.instant('CHECKOUT.SELECT_ADDRESS_FIRST'));
      return;
    }
    if (!this.isBranchVerified(this.selectedBranch)) {
      this.showBranchVerificationRequired();
      return;
    }

    if (this.wholesalerGroups.length === 0) {
      this.showErrorAlert(this.translate.instant('CHECKOUT.NO_ITEMS_ERROR'));
      return;
    }

    // Set loading state
    this.paymentInProgress = true;
    this.isLoading = true;

    // Ensure pricing is calculated
    this.calculateGroupPricing();

    try {
      const orderData = {
        wholesalerGroups: this.wholesalerGroups,
        selectedBranch: this.selectedBranch,
        deliveryAddress: this.selectedBranch.address || '',
        deliveryPincode: this.selectedBranch.pincode || '',
        discount: this.discount,
        grandTotal: this.grandTotal,
        hasTransport: this.hasRideRequest,
        transportData: this.transportData,
        transporterCost: this.estimatedRidePrice,
        retailer: this.retailerInfo,
        retailerBranchId: this.selectedBranch.branch_id
      };

      this.router.navigate(['/buyer/payment'], {
        state: { orderData }
      });
    } finally {
      // Reset loading state after navigation
      this.paymentInProgress = false;
      this.isLoading = false;
    }
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
    // If we have the grouped summary from cart, use it
    if (this.wholesalerGroups.length === 1) {
      const g = this.wholesalerGroups[0];
      return `${g.wholesalerName} · ${g.branchName}`;
    }

    if (this.wholesalerGroups.length > 1) {
      // Multiple wholesalers selected — show count
      return `${this.wholesalerGroups.length} ${this.translate.instant('CHECKOUT.WHOLESALERS')}`;
    }

    // Fallback to the old single-wholesaler path
    if (!this.wholeSeller) {
      return this.translate.instant('CHECKOUT.DIRECT_ORDER');
    }
    return this.wholeSeller?.name || this.translate.instant('CHECKOUT.UNKNOWN_WHOLESELLER');
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/img/default-product.png';
  }

  private async showErrorAlert(message: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('CHECKOUT.ERROR'),
      message: message,
      buttons: [this.translate.instant('CHECKOUT.OK')]
    });
    await alert.present();
  }

  /**
   * Maps HTTP error codes and error types to user-friendly messages
   * Handles network, timeout, and server errors gracefully
   *
   * @param error - The error object from HTTP call
   * @returns Translated user-friendly error message
   */
  private getErrorMessage(error: any): string {
    if (!error) {
      return this.translate.instant('CHECKOUT.UNEXPECTED_ERROR');
    }

    // Handle timeout errors
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      return this.translate.instant('REQUEST_TIMEOUT_ERROR');
    }

    // Handle network errors
    if (error.status === 0 || error.message?.includes('network')) {
      return this.translate.instant('NETWORK_ERROR');
    }

    // Handle authentication errors
    if (error.status === 401) {
      return this.translate.instant('CHECKOUT.SESSION_EXPIRED');
    }

    // Handle authorization errors
    if (error.status === 403) {
      return this.translate.instant('CHECKOUT.NO_PERMISSION');
    }

    // Handle not found errors
    if (error.status === 404) {
      return this.translate.instant('NOT_FOUND');
    }

    // Handle rate limit errors
    if (error.status === 429) {
      return this.translate.instant('RATE_LIMIT_ERROR');
    }

    // Handle server errors
    if (error.status >= 500) {
      return this.translate.instant('SERVER_ERROR');
    }

    // Default error message
    return this.translate.instant('CHECKOUT.UNEXPECTED_ERROR');
  }

  private async showInfoAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: header,
      message: message,
      buttons: [this.translate.instant('CHECKOUT.OK')]
    });
    await alert.present();
  }
}
