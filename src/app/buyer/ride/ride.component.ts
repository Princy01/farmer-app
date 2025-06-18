import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  chevronBack,
  busOutline,
  carOutline,
  bicycleOutline,
  rocketOutline,
  timeOutline,
  shieldCheckmarkOutline,
  cashOutline,
  settingsOutline,
  sunnyOutline,
  partlySunnyOutline,
  moonOutline,
  warningOutline,
  snowOutline,
  handLeftOutline,
  createOutline,
  calculatorOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  lockClosedOutline,
  starOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-ride',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './ride.component.html',
  styleUrls: ['./ride.component.scss'],
})
export class RideComponent {
  selectedTransportType: string | null = null;
  selectedTimeSlot: string | null = null;
  additionalNotes: string = '';

  // Simulate user premium status - change this based on your user service
  isPremiumUser: boolean = false; // Set to true to test premium mode

  specialInstructions = {
    fragile: false,
    coldChain: false,
    contactless: false,
    signature: false
  };

  constructor(private router: Router) {
    addIcons({
      chevronBack,
      busOutline,
      carOutline,
      bicycleOutline,
      rocketOutline,
      timeOutline,
      shieldCheckmarkOutline,
      cashOutline,
      settingsOutline,
      sunnyOutline,
      partlySunnyOutline,
      moonOutline,
      warningOutline,
      snowOutline,
      handLeftOutline,
      createOutline,
      calculatorOutline,
      checkmarkCircle,
      checkmarkCircleOutline,
      lockClosedOutline,
      starOutline
    });
  }

  goBack() {
    this.router.navigate(['/buyer/checkout']);
  }

  selectTransportType(type: string) {
    // Prevent selection of priority if user is not premium
    if (type === 'priority' && !this.isPremiumUser) {
      this.showPremiumUpgradeModal();
      return;
    }
    this.selectedTransportType = type;
  }

  selectTimeSlot(slot: string) {
    this.selectedTimeSlot = slot;
  }

  showPremiumUpgradeModal() {
  // implement a modal or toast here
  console.log('Premium upgrade required');
  // For now, just show an alert - replace with proper modal implementation
  alert('🌟 Upgrade to Premium!\n\n✓ Priority delivery\n✓ Premium support\n✓ Exclusive benefits\n\nUpgrade now to unlock all premium features!');
}

// Add this method to handle the upgrade button click specifically
upgradeToPremium(event: Event) {
  event.stopPropagation(); // Prevent card click
  console.log('Upgrading to premium membership...');


  // For demo purposes, let's simulate the upgrade
  if (confirm('Would you like to upgrade to Premium for ₹299/month?\n\n✓ Priority delivery\n✓ Premium support\n✓ Exclusive benefits')) {
    // Simulate successful upgrade
    this.isPremiumUser = true;
    alert('🎉 Welcome to Premium! You now have access to all premium features.');
  }
}

  getBaseDeliveryCharge(): number {
    switch (this.selectedTransportType) {
      case 'standard': return 75;
      case 'express': return 200;
      case 'priority': return 400;
      default: return 0;
    }
  }

  getTotalDeliveryCost(): number {
    let total = this.getBaseDeliveryCharge();

    if (this.specialInstructions.fragile) total += 25;
    if (this.specialInstructions.coldChain) total += 50;
    if (this.selectedTimeSlot && this.selectedTimeSlot !== 'flexible') total += 20;

    return total;
  }

  getTransportTypeName(): string {
    switch (this.selectedTransportType) {
      case 'standard': return 'Standard Delivery';
      case 'express': return 'Express Delivery';
      case 'priority': return 'Priority Delivery';
      default: return '';
    }
  }

  getEstimatedDeliveryTime(): string {
    switch (this.selectedTransportType) {
      case 'standard': return '3-5 business days';
      case 'express': return '1-2 business days';
      case 'priority': return 'Same day (4-6 hours)';
      default: return '';
    }
  }

  confirmTransportSelection() {
    const transportData = {
      type: this.selectedTransportType,
      timeSlot: this.selectedTimeSlot,
      specialInstructions: this.specialInstructions,
      additionalNotes: this.additionalNotes,
      totalCost: this.getTotalDeliveryCost()
    };

    console.log('Transport selection confirmed:', transportData);

    this.router.navigate(['/buyer/checkout'], {
      queryParams: {
        transportType: this.selectedTransportType,
        timeSlot: this.selectedTimeSlot,
        specialInstructions: JSON.stringify(this.specialInstructions),
        additionalNotes: this.additionalNotes,
        transportCost: this.getTotalDeliveryCost()
      },
    });
  }
}