import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
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

@Component({
  selector: 'app-ride',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe],
  templateUrl: './ride.component.html',
  styleUrls: ['./ride.component.scss'],
})
export class RideComponent implements OnInit {
  private checkoutData: any = null;
  private existingTransportData: any = null; // Store existing transport data from navigation

  selectedTransportType: string | null = null;

  totalWeight: number = 0;
  pickupLocation: string = '';
  dropoffLocation: string = 'Destination';
  distance: number = 50;

  // Simulate user premium status - change this based on user service
  isPremiumUser: boolean = false; // Set to true to test premium mode

  constructor(
    private router: Router,
    private translate: TranslateService,
    private route: ActivatedRoute
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

    // Get data from navigation state
    const navigation = this.router.getCurrentNavigation();
    const navData = navigation?.extras?.state;

    if (navData) {
      this.totalWeight = navData['totalWeight'] || 0;
      this.pickupLocation = navData['pickup'] || '';
      this.dropoffLocation = navData['delivery'] || 'Destination';

      this.distance = navData['distance'] || this.calculateDummyDistance();

      // Store existing transport data and initialize selection if present
      this.existingTransportData = navData['transportData'] || null;
      if (this.existingTransportData) {
        this.selectedTransportType = this.existingTransportData.delivery_type || null;
      }

      // Store all checkout data to pass back
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
        dropoffBranchId: navData['dropoffBranchId']
      };
    }
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['totalWeight']) this.totalWeight = +params['totalWeight'];
      if (params['pickup']) this.pickupLocation = params['pickup'];
      if (params['delivery']) this.dropoffLocation = params['delivery'];
      if (params['distance']) this.distance = +params['distance'];
    });

    if (this.distance === 0) {
      this.distance = this.calculateDummyDistance();
    }
  }

  // Calculate dummy distance for demonstration
  calculateDummyDistance(): number {
    // Generate random distance between 5 and 100 km
    // In production, use actual coordinates and distance calculation API
    return Math.floor(Math.random() * (100 - 5 + 1)) + 5;
  }

  goBack() {
    let transportDataToPass = this.existingTransportData;
    if (this.selectedTransportType && (!this.existingTransportData || this.selectedTransportType !== this.existingTransportData.delivery_type)) {
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
  }

  selectTransportType(type: string) {
    // Prevent selection of priority if user is not premium
    if (type === 'priority' && !this.isPremiumUser) {
      this.showPremiumUpgradeModal();
      return;
    }
    this.selectedTransportType = type;
  }

  showPremiumUpgradeModal() {
    console.log('Premium upgrade required');
    alert(this.translate.instant('RIDE.PREMIUM_UPGRADE_MESSAGE'));
  }

  upgradeToPremium(event: Event) {
    event.stopPropagation(); // Prevent card click
    console.log('Upgrading to premium membership...');

    if (confirm(this.translate.instant('RIDE.PREMIUM_UPGRADE_CONFIRM'))) {
      // Simulate successful upgrade
      this.isPremiumUser = true;
      alert(this.translate.instant('RIDE.PREMIUM_UPGRADE_SUCCESS'));
    }
  }

  getBaseDeliveryCharge(): number {
    const ratesPerKm = { standard: 8, express: 15, priority: 25 };
    const rate = ratesPerKm[this.selectedTransportType as keyof typeof ratesPerKm] || 0;
    return Math.max(50, Math.round(rate * this.distance));
  }

  getTotalDeliveryCost(): number {
    return this.getBaseDeliveryCharge();
  }

  getRatePerKm(): number {
    switch (this.selectedTransportType) {
      case 'standard': return 8;
      case 'express': return 15;
      case 'priority': return 25;
      default: return 0;
    }
  }

  getTransportTypeName(): string {
    switch (this.selectedTransportType) {
      case 'standard': return this.translate.instant('RIDE.STANDARD_DELIVERY');
      case 'express': return this.translate.instant('RIDE.EXPRESS_DELIVERY');
      case 'priority': return this.translate.instant('RIDE.PRIORITY_DELIVERY');
      default: return '';
    }
  }

  getEstimatedDeliveryTime(): string {
    switch (this.selectedTransportType) {
      case 'standard': return this.translate.instant('RIDE.STANDARD_TIME');
      case 'express': return this.translate.instant('RIDE.EXPRESS_TIME');
      case 'priority': return this.translate.instant('RIDE.PRIORITY_TIME');
      default: return '';
    }
  }

  confirmTransportSelection() {
    if (!this.selectedTransportType) {
      alert(this.translate.instant('RIDE.SELECT_TRANSPORT_TYPE'));
      return;
    }

    const transportRequestData = {
      delivery_type: this.selectedTransportType,
      distance: this.distance,
      load_type: 'general',
      status: 'pending'
    };

    console.log('Confirmed transport data (passed to checkout/payment):', transportRequestData);

    this.router.navigate(['/buyer/checkout'], {
      state: {
        ...this.checkoutData,
        transportData: transportRequestData,
        hasTransport: true
      }
    });
  }
}