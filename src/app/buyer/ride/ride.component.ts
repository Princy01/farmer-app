import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { chevronBack, cube, people, flash, hourglass } from 'ionicons/icons';

@Component({
  selector: 'app-ride',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './ride.component.html',
  styleUrls: ['./ride.component.scss'],
})
export class RideComponent {
  selectedDeliveryType: string | null = null;
  selectedUrgency: string | null = null;

  constructor(private router: Router) {
    addIcons({ chevronBack, cube, people, flash, hourglass });
  }

  goBack() {
    this.router.navigate(['/buyer/checkout']);
  }

  selectDeliveryType(type: string) {
    this.selectedDeliveryType = type;
  }

  selectUrgency(urgency: string) {
    this.selectedUrgency = urgency;
  }

  confirmRide() {
    console.log('Ride confirmed with:', {
      deliveryType: this.selectedDeliveryType,
      urgency: this.selectedUrgency,
    });

    // Redirect to checkout after confirmation
    this.router.navigate(['/buyer/checkout'], {
      queryParams: {
        deliveryType: this.selectedDeliveryType,
        urgency: this.selectedUrgency,
      },
    });
  }
}
