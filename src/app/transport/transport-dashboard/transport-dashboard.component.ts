import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UpcomingDeliveriesService } from 'src/app//services/upcoming-deliveries.service';

@Component({
  selector: 'app-transport-dashboard',
  standalone: true,
  templateUrl: './transport-dashboard.component.html',
  styleUrls: ['./transport-dashboard.component.scss'],
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class TransportDashboardComponent implements OnInit  {
  selectedTab = 'active';

  activeDeliveries = [
    { id: 'ORD12345', wholesaler: 'Wholesaler X', buyer: 'Retailer A', location: 'Market X', deliveryAddress: '123 Main St, City A', status: 'On the way' },
    { id: 'ORD67890', wholesaler: 'Wholesaler Y', buyer: 'Retailer B', location: 'Market Y', deliveryAddress: '456 Elm St, City B', status: 'Delayed' },
    { id: 'ORD54321', wholesaler: 'Wholesaler Z', buyer: 'Retailer C', location: 'Market O', deliveryAddress: '789 Pine St, City C', status: 'On the way' },
  ];


  upcomingDeliveries: any[] = [];

  completedDeliveries = [
    { id: 'ORD33445', wholesaler: 'Wholesaler B', buyer: 'Retailer E', location: 'Market W', deliveryAddress: '202 Oak St, City E', status: 'Delivered' }
  ];
  constructor(private upcomingDeliveriesService: UpcomingDeliveriesService) {}

  ngOnInit() {
    this.loadUpcomingDeliveries();
  }
  loadUpcomingDeliveries() {
    this.upcomingDeliveries = this.upcomingDeliveriesService.getAcceptedOrders();
  }

  onTabChange() {
    if (this.selectedTab === 'upcoming') {
      this.loadUpcomingDeliveries(); // Reload upcoming deliveries
    }
  }

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
