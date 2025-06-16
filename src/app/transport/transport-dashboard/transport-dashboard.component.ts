import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UpcomingDeliveriesService } from 'src/app//services/upcoming-deliveries.service';
import { DeliveryService } from './delivery.service';

@Component({
  selector: 'app-transport-dashboard',
  standalone: true,
  templateUrl: './transport-dashboard.component.html',
  styleUrls: ['./transport-dashboard.component.scss'],
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class TransportDashboardComponent implements OnInit  {
   selectedTab = 'active';

  activeDeliveries: any[] = [];
  upcomingDeliveries: any[] = [];
  completedDeliveries: any[] = [];

  constructor(private deliveryService: DeliveryService) {}

  ngOnInit() {
    this.loadDeliveries('active');
  }

  onTabChange() {
    this.loadDeliveries(this.selectedTab);
  }

  loadDeliveries(tab: string) {
    switch (tab) {
      case 'active':
        this.deliveryService.getActiveDeliveries().subscribe((res: any) => {
          this.activeDeliveries = res.deliveries || [];
        });
        break;
      case 'upcoming':
        this.deliveryService.getUpcomingDeliveries().subscribe((res: any) => {
          this.upcomingDeliveries = res.deliveries || [];
        });
        break;
      case 'completed':
        this.deliveryService.getCompletedDeliveries().subscribe((res: any) => {
          this.completedDeliveries = res.deliveries || [];
        });
        break;
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