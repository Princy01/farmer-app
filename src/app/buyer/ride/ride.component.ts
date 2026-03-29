import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TranslatePipe } from '@ngx-translate/core';
import { BuyerApiService } from '../services/buyer-api.service';
import { addIcons } from 'ionicons';
import { Subject, takeUntil } from 'rxjs';
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
  delivery_type: TransportType;
  distance: number;
  distance_km: number;
  load_type: string;
  status: string;
  urgency: 'low' | 'standard' | 'high';
  base_price: number;
}

@Component({
  selector: 'app-ride',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe],
  templateUrl: './ride.component.html',
  styleUrls: ['./ride.component.scss'],
})
export class RideComponent implements OnInit, OnDestroy {
  private checkoutData: CheckoutData = {};
  private readonly destroy$ = new Subject<void>();
  private existingTransportData: TransportData | null = null;
  private pickupLat: number = 0;
  private pickupLon: number = 0;
  private dropoffLat: number = 0;
  private dropoffLon: number = 0;
  private jobId: number = 0;

  selectedTransportType: TransportType | null = null;

  totalWeight: number = 0;
  pickupLocation: string = '';
  dropoffLocation: string = '';
  distance: number = 0; // Distance in km
  isLoadingDistance: boolean = false;

  isPremiumUser: boolean = false;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private buyerApiService: BuyerApiService
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

    // If coordinates are available, calculate actual distance from backend
    if (this.pickupLat && this.pickupLon && this.dropoffLat && this.dropoffLon) {
      this.calculateDistanceFromBackend();
    } else if (this.distance === 0) {
      // Fallback to dummy distance if no coordinates
      this.distance = this.calculateDummyDistance();
    }

    // Validate required data
    if (!this.validateRequiredData()) {
      this.showErrorAndNavigateBack();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private calculateDistanceFromBackend(): void {
    this.isLoadingDistance = true;
    this.buyerApiService.getRouteMetrics(
      this.pickupLat,
      this.pickupLon,
      this.dropoffLat,
      this.dropoffLon
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        // Convert meters to km and round to 2 decimal places
        this.distance = Math.round((response.distance_meters / 1000) * 100) / 100;
        this.isLoadingDistance = false;
      },
      error: () => {
        // Fallback to dummy distance on error
        this.distance = this.calculateDummyDistance();
        this.isLoadingDistance = false;
      }
    });
  }

  private initializeFromNavigationState(): void {
    try {
      const navigation = this.router.getCurrentNavigation();
      const navData = navigation?.extras?.state;

      if (!navData) {
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

      // Extract coordinates from available data
      if (navData['selectedBranch']) {
        const branch = navData['selectedBranch'];
        if (branch.latitude && branch.longitude) {
          this.dropoffLat = branch.latitude;
          this.dropoffLon = branch.longitude;
        }
      }

      // Try to get wholeseller/retailer coordinates
      if (navData['wholeseller'] && navData['wholeseller'].latitude && navData['wholeseller'].longitude) {
        this.pickupLat = navData['wholeseller'].latitude;
        this.pickupLon = navData['wholeseller'].longitude;
      }

      // Try to get job ID from wholeseller or other source
      if (navData['wholeseller'] && navData['wholeseller'].id) {
        this.jobId = navData['wholeseller'].id;
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
    } catch {
      return;
    }
  }

  private initializeFromQueryParams(): void {
    try {
      this.route.queryParams.pipe(
        takeUntil(this.destroy$)
      ).subscribe(params => {
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
    } catch {
      return;
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
        const basePrice = this.getBaseDeliveryCharge();
        const urgency = this.selectedTransportType === 'priority' ? 'high' : 'standard';

        transportDataToPass = {
          delivery_type: this.selectedTransportType,
          distance: this.distance * 1000, // Store in meters
          distance_km: this.distance,
          load_type: 'general',
          status: 'pending',
          urgency: urgency,
          base_price: basePrice
        } as TransportData;
      }

      this.router.navigate(['/buyer/checkout'], {
        state: {
          ...this.checkoutData,
          transportData: transportDataToPass,
          hasTransport: !!transportDataToPass
        }
      });
    } catch {
      return;
    }
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

      const basePrice = this.getBaseDeliveryCharge();
      const urgency = this.selectedTransportType === 'priority' ? 'high' : 'standard';

      const transportRequestData: TransportData = {
        delivery_type: this.selectedTransportType,
        distance: this.distance * 1000, // Store in meters
        distance_km: this.distance,
        load_type: 'general',
        status: 'pending',
        urgency: urgency,
        base_price: basePrice
      };

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

      const errorAlert = await this.alertController.create({
        header: this.translate.instant('RIDE.ERROR_TITLE'),
        message: this.translate.instant('RIDE.CONFIRMATION_ERROR'),
        buttons: [this.translate.instant('COMMON.OK')]
      });

      await errorAlert.present();
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
            return;
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

      const errorAlert = await this.alertController.create({
        header: this.translate.instant('RIDE.ERROR_TITLE'),
        message: this.translate.instant('RIDE.UPGRADE_ERROR'),
        buttons: [this.translate.instant('COMMON.OK')]
      });

      await errorAlert.present();
    }
  }

  getBaseDeliveryCharge(): number {
    if (!this.selectedTransportType || this.distance === 0) {
      return 0;
    }

    // Delivery type multipliers (currently all 1, will be customizable later)
    const multipliers: Record<TransportType, number> = {
      standard: 1,
      express: 1,
      priority: 1
    };

    const ratesPerKm: Record<TransportType, number> = {
      standard: DELIVERY_RATES.STANDARD,
      express: DELIVERY_RATES.EXPRESS,
      priority: DELIVERY_RATES.PRIORITY
    };

    const rate = ratesPerKm[this.selectedTransportType] || 0;
    const multiplier = multipliers[this.selectedTransportType] || 1;
    const calculatedPrice = rate * this.distance * multiplier;

    return Math.max(DELIVERY_RATES.MIN_CHARGE, Math.round(calculatedPrice));
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

}