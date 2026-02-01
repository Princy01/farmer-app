import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  chevronBack,
  carOutline,
  bicycleOutline,
  rocketOutline,
  timeOutline,
  cashOutline,
  calculatorOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  starOutline,
  navigateOutline
} from 'ionicons/icons';

// Constants for delivery rates
const DELIVERY_RATES = {
  STANDARD: 8,
  EXPRESS: 15,
  PRIORITY: 25,
  MIN_CHARGE: 50
} as const;

const DISTANCE_RANGE = {
  MIN: 5,
  MAX: 100
} as const;

type TransportType = 'standard' | 'express' | 'priority';

interface CheckoutData {
  cartItems?: any[];
  totalPrice?: number;
  discount?: number;
  retailer?: any;
  wholeseller?: any;
  selectedBranch?: any;
  pickupCityId?: string;
  pickupBranchId?: string;
  dropoffCityId?: string;
  dropoffBranchId?: string;
  wholesalerGroups?: any[];
}

interface TransportData {
  delivery_type: string;
  distance: number;
  load_type: string;
  status: string;
}

@Component({
  selector: 'app-ride',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe],
  templateUrl: './ride.component.html',
  styleUrls: ['./ride.component.scss'],
})
export class RideComponent implements OnInit {
  private checkoutData: CheckoutData = {};
  private existingTransportData: TransportData | null = null;

  selectedTransportType: TransportType | null = null;

  totalWeight: number = 0;
  pickupLocation: string = '';
  dropoffLocation: string = '';
  distance: number = 0;

  isPremiumUser: boolean = false;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    addIcons({
      chevronBack,
      carOutline,
      bicycleOutline,
      rocketOutline,
      timeOutline,
      cashOutline,
      calculatorOutline,
      checkmarkCircle,
      checkmarkCircleOutline,
      starOutline,
      navigateOutline
    });

    this.initializeFromNavigationState();
  }

  ngOnInit(): void {
    this.initializeFromQueryParams();

    if (this.distance === 0) {
      this.distance = this.calculateDummyDistance();
    }

    // Validate required data
    if (!this.validateRequiredData()) {
      this.showErrorAndNavigateBack();
    }
  }

  private initializeFromNavigationState(): void {
    try {
      const navigation = this.router.getCurrentNavigation();
      const navData = navigation?.extras?.state;

      if (!navData) {
        console.warn('No navigation state data found');
        return;
      }

      this.totalWeight = navData['totalWeight'] || 0;
      this.pickupLocation = navData['pickup'] || '';
      this.dropoffLocation = navData['delivery'] || '';
      this.distance = navData['distance'] || 0;

      this.existingTransportData = navData['transportData'] || null;
      if (this.existingTransportData?.delivery_type) {
        this.selectedTransportType = this.existingTransportData.delivery_type as TransportType;
      }

      this.checkoutData = {
        cartItems: navData['cartItems'],
        totalPrice: navData['totalPrice'],
        discount: navData['discount'],
        retailer: navData['retailer'],
        wholeseller: navData['wholeseller'],
        selectedBranch: navData['selectedBranch'],
        pickupCityId: navData['pickupCityId'],
        pickupBranchId: navData['pickupBranchId'],
        dropoffCityId: navData['dropoffCityId'],
        dropoffBranchId: navData['dropoffBranchId'],
        wholesalerGroups: navData['wholesalerGroups']
      };
    } catch (error) {
      console.error('Error initializing from navigation state:', error);
    }
  }

  private initializeFromQueryParams(): void {
    try {
      this.route.queryParams.subscribe(params => {
        if (params['totalWeight']) {
          this.totalWeight = +params['totalWeight'];
        }
        if (params['pickup']) {
          this.pickupLocation = params['pickup'];
        }
        if (params['delivery']) {
          this.dropoffLocation = params['delivery'];
        }
        if (params['distance']) {
          this.distance = +params['distance'];
        }
      });
    } catch (error) {
      console.error('Error initializing from query params:', error);
    }
  }

  private validateRequiredData(): boolean {
    return !!(this.pickupLocation && this.dropoffLocation);
  }

  private async showErrorAndNavigateBack(): Promise<void> {
    const alert = await this.alertController.create({
      header: this.translate.instant('RIDE.ERROR_TITLE'),
      message: this.translate.instant('RIDE.MISSING_DATA_ERROR'),
      buttons: [
        {
          text: this.translate.instant('COMMON.OK'),
          handler: () => {
            this.router.navigate(['/buyer/checkout']);
          }
        }
      ]
    });

    await alert.present();
  }

  private calculateDummyDistance(): number {
    return Math.floor(
      Math.random() * (DISTANCE_RANGE.MAX - DISTANCE_RANGE.MIN + 1)
    ) + DISTANCE_RANGE.MIN;
  }

  goBack(): void {
    try {
      let transportDataToPass = this.existingTransportData;

      if (
        this.selectedTransportType &&
        (!this.existingTransportData ||
          this.selectedTransportType !== this.existingTransportData.delivery_type)
      ) {
        transportDataToPass = {
          delivery_type: this.selectedTransportType,
          distance: this.distance,
          load_type: 'general',
          status: 'pending'
        };
      }

      this.router.navigate(['/buyer/checkout'], {
        state: {
          ...this.checkoutData,
          transportData: transportDataToPass,
          hasTransport: !!transportDataToPass
        }
      });
    } catch (error) {
      console.error('Error navigating back:', error);
    }
  }

  async selectTransportType(type: string): Promise<void> {
    if (type === 'priority' && !this.isPremiumUser) {
      await this.showPremiumUpgradeModal();
      return;
    }
    this.selectedTransportType = type as TransportType;
  }

  private async showPremiumUpgradeModal(): Promise<void> {
    const alert = await this.alertController.create({
      header: this.translate.instant('RIDE.PREMIUM_REQUIRED_TITLE'),
      message: this.translate.instant('RIDE.PREMIUM_UPGRADE_MESSAGE'),
      buttons: [
        {
          text: this.translate.instant('COMMON.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('RIDE.UPGRADE_NOW'),
          handler: () => {
            // Navigate to premium upgrade page or handle upgrade
            console.log('Navigate to premium upgrade');
          }
        }
      ]
    });

    await alert.present();
  }

  async upgradeToPremium(event: Event): Promise<void> {
    event.stopPropagation();

    const alert = await this.alertController.create({
      header: this.translate.instant('RIDE.UPGRADE_TO_PREMIUM'),
      message: this.translate.instant('RIDE.PREMIUM_UPGRADE_CONFIRM'),
      buttons: [
        {
          text: this.translate.instant('COMMON.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('COMMON.CONFIRM'),
          handler: async () => {
            await this.processPremiumUpgrade();
          }
        }
      ]
    });

    await alert.present();
  }

  private async processPremiumUpgrade(): Promise<void> {
    const loading = await this.loadingController.create({
      message: this.translate.instant('RIDE.PROCESSING_UPGRADE')
    });

    try {
      await loading.present();

      // Simulate API call for upgrade
      await new Promise(resolve => setTimeout(resolve, 1500));

      this.isPremiumUser = true;

      await loading.dismiss();

      const successAlert = await this.alertController.create({
        header: this.translate.instant('COMMON.SUCCESS'),
        message: this.translate.instant('RIDE.PREMIUM_UPGRADE_SUCCESS'),
        buttons: [this.translate.instant('COMMON.OK')]
      });

      await successAlert.present();
    } catch (error) {
      await loading.dismiss();
      console.error('Error upgrading to premium:', error);

      const errorAlert = await this.alertController.create({
        header: this.translate.instant('RIDE.ERROR_TITLE'),
        message: this.translate.instant('RIDE.UPGRADE_ERROR'),
        buttons: [this.translate.instant('COMMON.OK')]
      });

      await errorAlert.present();
    }
  }

  getBaseDeliveryCharge(): number {
    if (!this.selectedTransportType) {
      return 0;
    }

    const ratesPerKm: Record<TransportType, number> = {
      standard: DELIVERY_RATES.STANDARD,
      express: DELIVERY_RATES.EXPRESS,
      priority: DELIVERY_RATES.PRIORITY
    };

    const rate = ratesPerKm[this.selectedTransportType] || 0;
    return Math.max(DELIVERY_RATES.MIN_CHARGE, Math.round(rate * this.distance));
  }

  getTotalDeliveryCost(): number {
    return this.getBaseDeliveryCharge();
  }

  getRatePerKm(): number {
    const rates: Record<TransportType, number> = {
      standard: DELIVERY_RATES.STANDARD,
      express: DELIVERY_RATES.EXPRESS,
      priority: DELIVERY_RATES.PRIORITY
    };

    return this.selectedTransportType ? rates[this.selectedTransportType] : 0;
  }

  getTransportTypeName(): string {
    if (!this.selectedTransportType) {
      return '';
    }

    const names: Record<TransportType, string> = {
      standard: 'RIDE.STANDARD_DELIVERY',
      express: 'RIDE.EXPRESS_DELIVERY',
      priority: 'RIDE.PRIORITY_DELIVERY'
    };

    return this.translate.instant(names[this.selectedTransportType]);
  }

  getEstimatedDeliveryTime(): string {
    if (!this.selectedTransportType) {
      return '';
    }

    const times: Record<TransportType, string> = {
      standard: 'RIDE.STANDARD_TIME',
      express: 'RIDE.EXPRESS_TIME',
      priority: 'RIDE.PRIORITY_TIME'
    };

    return this.translate.instant(times[this.selectedTransportType]);
  }

  async confirmTransportSelection(): Promise<void> {
    if (!this.selectedTransportType) {
      const alert = await this.alertController.create({
        header: this.translate.instant('RIDE.ERROR_TITLE'),
        message: this.translate.instant('RIDE.SELECT_TRANSPORT_TYPE'),
        buttons: [this.translate.instant('COMMON.OK')]
      });

      await alert.present();
      return;
    }

    const loading = await this.loadingController.create({
      message: this.translate.instant('RIDE.CONFIRMING_SELECTION')
    });

    try {
      await loading.present();

      const transportRequestData: TransportData = {
        delivery_type: this.selectedTransportType,
        distance: this.distance,
        load_type: 'general',
        status: 'pending'
      };

      console.log('Confirmed transport data:', transportRequestData);

      await loading.dismiss();

      await this.router.navigate(['/buyer/checkout'], {
        state: {
          ...this.checkoutData,
          transportData: transportRequestData,
          hasTransport: true
        }
      });
    } catch (error) {
      await loading.dismiss();
      console.error('Error confirming transport selection:', error);

      const errorAlert = await this.alertController.create({
        header: this.translate.instant('RIDE.ERROR_TITLE'),
        message: this.translate.instant('RIDE.CONFIRMATION_ERROR'),
        buttons: [this.translate.instant('COMMON.OK')]
      });

      await errorAlert.present();
    }
  }
}