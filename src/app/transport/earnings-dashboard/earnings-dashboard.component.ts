import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-earnings-dashboard',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './earnings-dashboard.component.html',
  styleUrls: ['./earnings-dashboard.component.scss'],
})
export class EarningsDashboardComponent {
  totalEarnings = 25000;
  totalTrips = 35;
  pendingPayments = 5000;

  trips = [
    { id: 101, pickup: 'Delhi', drop: 'Agra', earnings: 1000, status: 'Paid' },
    { id: 102, pickup: 'Mumbai', drop: 'Pune', earnings: 1500, status: 'Pending' },
  ];

  bestRoutes = [
    { from: 'Delhi', to: 'Agra', trips: 50, earnings: 100000 },
    { from: 'Mumbai', to: 'Pune', trips: 30, earnings: 75000 },
  ];

  topCustomers = [
    { name: 'Retailer A', orders: 10, earnings: 50000 },
    { name: 'Wholesaler B', orders: 8, earnings: 40000 },
  ];

  pendingPaymentsList = [
    { orderId: 201, amount: 2000, dueDate: 'March 20, 2025' },
    { orderId: 202, amount: 3000, dueDate: 'March 22, 2025' },
  ];

  withdrawFunds() {
    console.log('Withdraw funds requested');
  }

  openFilterModal() {
    console.log('Open filter modal');
  }
}
