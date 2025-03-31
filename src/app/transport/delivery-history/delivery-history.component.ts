import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-delivery-history',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './delivery-history.component.html',
  styleUrls: ['./delivery-history.component.scss']
})
export class DeliveryHistoryComponent {
  searchQuery: string = '';
  orders = [
    { id: 101, pickup: 'Delhi', drop: 'Mumbai', load: 'Vegetables', charges: 5000, status: 'Completed', hasDispute: false },
    { id: 102, pickup: 'Pune', drop: 'Hyderabad', load: 'Fruits', charges: 3500, status: 'Completed', hasDispute: true },
    { id: 103, pickup: 'Bangalore', drop: 'Chennai', load: 'Grains', charges: 4000, status: 'Completed', hasDispute: false }
  ];
  filteredOrders = [...this.orders];

  filterDeliveries() {
    this.filteredOrders = this.orders.filter(order =>
      order.pickup.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      order.drop.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      order.id.toString().includes(this.searchQuery)
    );
  }

  resolveDispute(orderId: number) {
    console.log(`Resolving dispute for Order ID: ${orderId}`);
  }

  goToReports() {
    console.log('Navigating to Reports');
  }
}
