import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-transport-dashboard',
  standalone: true,
  templateUrl: './transport-dashboard.component.html',
  styleUrls: ['./transport-dashboard.component.scss'],
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class TransportDashboardComponent {
  selectedTab = 'active';

  activeDeliveries = [
    { id: 'ORD12345', buyer: 'Retailer A', location: 'Market X', status: 'On the way' },
    { id: 'ORD67890', buyer: 'Retailer B', location: 'Market Y', status: 'Delayed' },
    { id: 'ORD12345', buyer: 'Retailer Z', location: 'Market O', status: 'On the way' },
  ];

  upcomingDeliveries = [
    { id: 'ORD11223', buyer: 'Retailer C', location: 'Market Z', status: 'Scheduled' }
  ];

  completedDeliveries = [
    { id: 'ORD33445', buyer: 'Retailer D', location: 'Market W', status: 'Delivered' }
  ];

  getStatusColor(status: string): string {
    switch (status) {
      case 'On the way': return 'success';
      case 'Delayed': return 'warning';
      case 'Scheduled': return 'primary';
      case 'Delivered': return 'tertiary';
      default: return 'medium';
    }
  }
}
