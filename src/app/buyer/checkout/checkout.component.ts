import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  chevronBack,
  arrowForwardOutline,
  chevronDown,
  receiptOutline,
  personOutline,
  storefrontOutline,
  locationOutline,
  bagOutline,
  carOutline,
  calculatorOutline,
  pencilOutline,
  addOutline,
  rocketOutline,
  flashOutline,
  timeOutline,
  cashOutline,
  checkmarkCircle,
  searchOutline,
  settingsOutline,
  callOutline,
  mailOutline,
  person,
  checkmark
} from 'ionicons/icons';
import { DatabaseService } from '../../services/database.service';
import { CheckoutService, BusinessBranch } from './checkout.service';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslatePipe } from '@ngx-translate/core';

interface CartItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_id: number;
  unit_name: string;
  price_while_added: number;
  latest_wholesaler_price: number;
  price_updated_at?: string;
  is_active: boolean;
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

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit {
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
  selectedTransporter: string | null = null;
  availableTransporters: any[] = [];

  isSearchingDriver: boolean = false;
  hasRideRequest: boolean = false;

  // Delivery address properties
  businessBranches: BusinessBranch[] = [];
  selectedBranch: BusinessBranch | null = null;
  isLoadingBranches: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private alertCtrl: AlertController,
    private loadingController: LoadingController,
    private checkoutService: CheckoutService,
    private authService: AuthService,
    private translate: TranslateService
  ) {
    addIcons({
      chevronBack,
      arrowForwardOutline,
      chevronDown,
      receiptOutline,
      personOutline,
      storefrontOutline,
      locationOutline,
      bagOutline,
      carOutline,
      calculatorOutline,
      pencilOutline,
      addOutline,
      rocketOutline,
      flashOutline,
      timeOutline,
      cashOutline,
      checkmarkCircle,
      searchOutline,
      settingsOutline,
      callOutline,
      mailOutline,
      person,
      checkmark
    });

    this.loadTransporters();

    const navData = this.router.getCurrentNavigation()?.extras.state;
    if (navData) {
      this.cartItems = (navData['cartItems'] || []).map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_id: item.unit_id,
        unit_name: item.unit_name,
        price_while_added: item.price,  // Map 'price' from cart to 'price_while_added'
        latest_wholesaler_price: item.price,  // Assuming same for now; adjust if you have update logic
        price_updated_at: undefined,  // Set as needed
        is_active: !item.is_deleted  // Map based on cart's is_deleted
      }));
      this.totalPrice = navData['totalPrice'] || 0;
      this.retailerInfo = navData['retailer'] || null;
      this.wholeSeller = navData['wholeseller'] || null;
      this.grandTotal = this.totalPrice;
    }

    this.route.queryParams.subscribe((params) => {
      if (params['deliveryType']) {
        this.selectedDeliveryType = params['deliveryType'];
        this.hasRideRequest = true;
      }
      if (params['urgency']) {
        this.selectedUrgency = params['urgency'];
      }
      if (this.hasRideRequest) {
        setTimeout(() => this.confirmDriverSearch(), 100);
      }
      this.calculateRidePrice();
    });
  }

  ngOnInit() {
    this.calculateRidePrice();
    this.checkAuthAndLoadBranches();
  }

  private async checkAuthAndLoadBranches() {
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

  private async showAuthError() {
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

  private async showUnauthorizedError() {
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

  // Load business branches from backend
  async loadBusinessBranches() {
    this.isLoadingBranches = true;
    const loading = await this.loadingController.create({
      message: this.translate.instant('CHECKOUT.LOADING_BRANCHES')
    });
    await loading.present();

    try {
      const userId = this.authService.getUserId();
      if (!userId) {
        this.isLoadingBranches = false;
        this.businessBranches = [];
        loading.dismiss();
        await this.showAuthError();
        return;
      }

      this.checkoutService.getAllBusinessBranches().subscribe({
        next: (branches: BusinessBranch[]) => {
          this.businessBranches = branches?.filter(branch => branch.active_status) || [];

          // Auto-select first branch if available
          if (this.businessBranches.length > 0) {
            this.selectedBranch = this.businessBranches[0];
          }
          this.isLoadingBranches = false;
        },
        error: async (error: any) => {
          this.isLoadingBranches = false;
          this.businessBranches = [];
          loading.dismiss();

          console.error('Error loading business branches:', error);

          if (error.status === 401) {
            await this.showAuthError();
          }

          const alert = await this.alertCtrl.create({
            header: this.translate.instant('CHECKOUT.ERROR'),
            message: this.translate.instant('CHECKOUT.LOAD_BRANCHES_ERROR'),
            buttons: [this.translate.instant('CHECKOUT.OK')]
          });
          await alert.present();
        },
        complete: () => {
          loading.dismiss();
        }
      });
    } catch (error) {
      this.isLoadingBranches = false;
      this.businessBranches = [];
      loading.dismiss();

      console.error('Unexpected error:', error);

      const alert = await this.alertCtrl.create({
        header: this.translate.instant('CHECKOUT.ERROR'),
        message: this.translate.instant('CHECKOUT.UNEXPECTED_ERROR'),
        buttons: [this.translate.instant('CHECKOUT.OK')]
      });
      await alert.present();
    }
  }

  // Select a branch
  selectBranch(branch: BusinessBranch) {
    this.selectedBranch = branch;
    this.calculateRidePrice(); // Recalculate with new branch
  }

  // Add new delivery address (placeholder for future implementation)
  addNewAddress() {
    this.showInfoAlert(this.translate.instant('CHECKOUT.ADD_NEW_ADDRESS'), this.translate.instant('CHECKOUT.ADD_NEW_ADDRESS_MSG'));
  }

  // Track by function for better performance
  trackByBranchId(index: number, branch: BusinessBranch): number {
    return branch.branch_id;
  }

  private loadTransporters() {
    this.availableTransporters = this.databaseService.getAvailableTransporters();
  }

  calculateRidePrice() {
    if (this.selectedDeliveryType && this.selectedBranch) {
      const totalWeight = this.calculateTotalWeight();

      this.estimatedRidePrice = this.databaseService.calculateBasePrice(
        this.selectedBranch.city_name,
        'Destination',
        totalWeight,
        this.selectedDeliveryType,
        this.selectedUrgency || 'normal',
        this.selectedTransporter || undefined
      );
    } else {
      this.estimatedRidePrice = 0;
    }
    this.grandTotal = this.totalPrice + this.estimatedRidePrice;
  }

  selectTransporter(transporterId: string) {
    this.selectedTransporter = transporterId;
    this.calculateRidePrice();
  }

  arrangeRide() {
    if (!this.selectedBranch) {
      this.showErrorAlert(this.translate.instant('CHECKOUT.SELECT_ADDRESS_FIRST'));
      return;
    }

    this.router.navigate(['/buyer/ride'], {
      queryParams: {
        totalWeight: this.calculateTotalWeight(),
        pickup: this.selectedBranch.city_name,
        delivery: 'Destination'
      }
    });
  }

  async confirmDriverSearch() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('CHECKOUT.ESTIMATED_COST'),
      message: `${this.translate.instant('CHECKOUT.ESTIMATED_COST_MSG')} ₹${this.estimatedRidePrice}. ${this.translate.instant('CHECKOUT.SEARCH_DRIVER_QUESTION')}`,
      buttons: [
        {
          text: this.translate.instant('CHECKOUT.NO'),
          role: 'cancel',
          handler: () => {
            this.hasRideRequest = false;
            this.selectedDeliveryType = null;
            this.selectedUrgency = null;
            this.estimatedRidePrice = 0;
            this.calculateRidePrice();
          }
        },
        {
          text: this.translate.instant('CHECKOUT.YES'),
          handler: () => {
            this.startDriverSearch();
          }
        }
      ]
    });
    await alert.present();
  }

  private calculateTotalWeight(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  private async startDriverSearch() {
    this.isSearchingDriver = true;
    this.pollForDriverAssignment();
  }

  private currentOrderId: string | null = null;

  private async pollForDriverAssignment() {
    if (this.currentOrderId) {
      console.warn('Already polling for order:', this.currentOrderId);
      return;
    }

    if (!this.selectedBranch) {
      this.showErrorAlert(this.translate.instant('CHECKOUT.SELECT_ADDRESS_FIRST'));
      return;
    }

    const request = {
      deliveryType: this.selectedDeliveryType!,
      urgency: this.selectedUrgency!,
      pickup: this.selectedBranch.city_name,
      delivery: 'Destination',
      distance: this.getDistance(),
      load: {
        weight: this.calculateTotalWeight(),
        type: ""
      },
      basePrice: this.estimatedRidePrice,
      requestedDate: new Date().toISOString()
    };

    const newOrderId = await this.databaseService.createUnassignedOrder(request);
    this.currentOrderId = newOrderId;

    const pollInterval = setInterval(async () => {
      const assignedDriver = await this.databaseService.checkOrderAssignment(this.currentOrderId!);

      if (assignedDriver) {
        this.isSearchingDriver = false;
        this.selectedTransporter = assignedDriver.id;
        clearInterval(pollInterval);
        this.currentOrderId = null;
        this.showDriverFoundAlert(assignedDriver);
      }
    }, 5000);

    setTimeout(() => {
      if (this.isSearchingDriver) {
        clearInterval(pollInterval);
        this.isSearchingDriver = false;
        this.currentOrderId = null;
        this.showNoDriverAlert();
      }
    }, 120000);
  }

  private getDistance(): number {
    return Math.floor(Math.random() * (150 - 50 + 1)) + 50;
  }

  private async showDriverFoundAlert(driver: any) {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('CHECKOUT.DRIVER_FOUND'),
      message: `${driver.name} ${this.translate.instant('CHECKOUT.DRIVER_FOUND_MSG')}`,
      buttons: [this.translate.instant('CHECKOUT.OK')]
    });
    await alert.present();
  }

  private async showNoDriverAlert() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('CHECKOUT.NO_DRIVER'),
      message: this.translate.instant('CHECKOUT.NO_DRIVER_MSG'),
      buttons: [
        {
          text: this.translate.instant('CHECKOUT.NO'),
          role: 'cancel',
          handler: () => {
            this.hasRideRequest = false;
            this.selectedDeliveryType = null;
            this.selectedUrgency = null;
            this.estimatedRidePrice = 0;
            this.calculateRidePrice();
          }
        },
        {
          text: this.translate.instant('CHECKOUT.YES'),
          handler: () => {
            this.startDriverSearch();
          }
        }
      ]
    });
    await alert.present();
  }

  private async showErrorAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('CHECKOUT.ERROR'),
      message: message,
      buttons: [this.translate.instant('CHECKOUT.OK')]
    });
    await alert.present();
  }

  private async showInfoAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header: header,
      message: message,
      buttons: [this.translate.instant('CHECKOUT.OK')]
    });
    await alert.present();
  }

  proceedToPayment() {
    if (this.isLoading) return;

    if (!this.selectedBranch) {
      this.showErrorAlert(this.translate.instant('CHECKOUT.SELECT_ADDRESS_FIRST'));
      return;
    }

    const orderData = {
      items: this.cartItems,
      totalPrice: this.totalPrice,
      transportCost: this.estimatedRidePrice,
      grandTotal: this.grandTotal,
      retailerInfo: this.retailerInfo,
      wholeSeller: this.wholeSeller,
      selectedBranch: this.selectedBranch,
      hasTransport: this.hasRideRequest,
      selectedDeliveryType: this.selectedDeliveryType,
      selectedUrgency: this.selectedUrgency,
      selectedTransporter: this.selectedTransporter,
      transporterName: this.getAvailableTransporterName()
    };

    this.router.navigate(['/buyer/payment'], {
      state: { orderData }
    });
  }

  goBack() {
    this.router.navigate(['/buyer/cart']);
  }

  getAvailableTransporterName(): string {
    if (!this.selectedTransporter) return '';
    const transporter = this.availableTransporters.find(t => t.id === this.selectedTransporter);
    return transporter?.name || '';
  }

  getRetailerInfo(): string {
    if (!this.retailerInfo) return this.translate.instant('CHECKOUT.UNKNOWN_RETAILER');
    return `${this.retailerInfo.name || this.translate.instant('CHECKOUT.UNKNOWN')} - ${this.retailerInfo.location || this.translate.instant('CHECKOUT.UNKNOWN_LOCATION')}`;
  }

  getWholesellerInfo(): string {
    if (!this.wholeSeller) return this.translate.instant('CHECKOUT.DIRECT_ORDER');
    return `${this.wholeSeller.name || this.translate.instant('CHECKOUT.UNKNOWN_WHOLESELLER')}`;
  }
}