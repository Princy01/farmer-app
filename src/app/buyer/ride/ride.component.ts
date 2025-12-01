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
  starOutline
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

  selectedTransportType: string | null = null;

  totalWeight: number = 0;
  pickupLocation: string = '';
  dropoffLocation: string = 'Destination';
  distance: number = 0;

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
      starOutline
    });

    // Get data from navigation state
    const navigation = this.router.getCurrentNavigation();
    const navData = navigation?.extras?.state;

    if (navData) {
      this.totalWeight = navData['totalWeight'] || 0;
      this.pickupLocation = navData['pickup'] || '';
      this.dropoffLocation = navData['delivery'] || 'Destination';

            this.distance = this.calculateDummyDistance();

      // Store all checkout data to pass back
      this.checkoutData = {
        cartItems: navData['cartItems'],
        totalPrice: navData['totalPrice'],
        discount: navData['discount'],
        retailer: navData['retailer'],
        wholeseller: navData['wholeseller'],
        selectedBranch: navData['selectedBranch'],
        pickupCityId: navData['pickupCityId'],
        pickupBranchId: navData['pickupBranchId']
      };
    }
  }

  ngOnInit() {
    // Also check query params as backup
    this.route.queryParams.subscribe(params => {
      if (params['totalWeight']) {
        this.totalWeight = +params['totalWeight'] || 0;
      }
      if (params['pickup']) {
        this.pickupLocation = params['pickup'] || '';
      }
      if (params['delivery']) {
        this.dropoffLocation = params['delivery'] || 'Destination';
      }
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
    // Navigate back with checkout data intact
    if (this.checkoutData) {
      this.router.navigate(['/buyer/checkout'], {
        state: this.checkoutData
      });
    } else {
      this.router.navigate(['/buyer/checkout']);
    }
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
    // Base rates per km for each transport type
    const ratesPerKm = {
      standard: 8,   // ₹8 per km
      express: 15,   // ₹15 per km
      priority: 25   // ₹25 per km
    };

    let rate = 0;
    switch (this.selectedTransportType) {
      case 'standard':
        rate = ratesPerKm.standard;
        break;
      case 'express':
        rate = ratesPerKm.express;
        break;
      case 'priority':
        rate = ratesPerKm.priority;
        break;
      default:
        return 0;
    }

    // Calculate cost: rate per km * distance
    // Minimum charge of ₹50 for any delivery
    return Math.max(50, Math.round(rate * this.distance));
  }

  getTotalDeliveryCost(): number {
    return this.getBaseDeliveryCharge();
  }

  // Get rate per km for display
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

    const transportData = {
      pickup_location: this.pickupLocation,
      dropoff_location: this.dropoffLocation,
      weight: this.totalWeight,
      delivery_type: this.selectedTransportType,
      base_price: this.getTotalDeliveryCost(),
      urgency: this.selectedTransportType === 'priority' ? 'urgent' : 'normal',
      requested_date: new Date().toISOString(),
      load_type: 'general',
      status: 'pending',
      pickup_city_id: this.checkoutData?.pickupCityId,
      dropoff_city_id: undefined, // Add if you have this data
      pickup_branch_id: this.checkoutData?.pickupBranchId,
      dropoff_branch_id: undefined, // Add if you have this data
      distance: 50 // Calculate or estimate
    };

    console.log('Confirming transport with data:', transportData);

    // Navigate back to checkout with ALL data
    this.router.navigate(['/buyer/checkout'], {
      state: {
        ...this.checkoutData, // Spread all checkout data
        transportData,
        hasRideRequest: true
      }
    });
  }
}