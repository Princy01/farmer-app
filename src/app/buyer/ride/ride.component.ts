import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { chevronBack, flash, hourglass } from 'ionicons/icons';

@Component({
  selector: 'app-ride',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './ride.component.html',
  styleUrls: ['./ride.component.scss'],
})
export class RideComponent {
  selectedUrgency: string | null = null;

  constructor(private router: Router) {
    addIcons({ chevronBack, flash, hourglass });
  }

  goBack() {
    this.router.navigate(['/buyer/checkout']);
  }

  selectUrgency(urgency: string) {
    this.selectedUrgency = urgency;
  }

  confirmRide() {
    console.log('Ride confirmed with urgency:', this.selectedUrgency);

    this.router.navigate(['/buyer/checkout'], {
      queryParams: {
        urgency: this.selectedUrgency,
      },
    });
  }
}
