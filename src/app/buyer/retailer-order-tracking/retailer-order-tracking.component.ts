import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-retailer-order-tracking',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './retailer-order-tracking.component.html',
  styleUrls: ['./retailer-order-tracking.component.scss'],
})
export class RetailerOrderTrackingComponent implements OnInit {
  orders: any[] = [];

  ngOnInit() {
    this.orders = [
      {
        orderId: 'ORD004',
        placedAt: '2025-04-05T09:00:00Z',
        status: 'Cancelled',
        location: null,
      },
      {
        orderId: 'ORD003',
        placedAt: '2025-04-04T15:45:00Z',
        status: 'Placed',
        location: null,
      },
      {
        orderId: 'ORD002',
        placedAt: '2025-04-03T12:30:00Z',
        status: 'In Transit',
        location: {
          address: 'Near Rajiv Chowk, New Delhi, India',
        },
      },
      {
        orderId: 'ORD001',
        placedAt: '2025-04-02T10:00:00Z',
        status: 'Delivered',
        location: null,
      },
    ];

    // Sort newest to oldest
    this.orders.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'In Transit':
        return 'orange';
      case 'Delivered':
        return 'green';
      case 'Cancelled':
        return 'red';
      case 'Placed':
        return '#007bff'; // blue
      default:
        return 'black';
    }
  }

}
