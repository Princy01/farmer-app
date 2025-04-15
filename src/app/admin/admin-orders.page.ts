import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { MOCK_ORDERS } from './mock-orders';

@Component({
  standalone: true,
  selector: 'app-admin-orders',
  imports: [CommonModule, IonicModule],
  templateUrl: './admin-orders.page.html',
  styleUrls: ['./admin-orders.page.scss']
})
export class AdminOrdersPage {
  orders = MOCK_ORDERS;
  filteredOrders = this.orders;

  constructor(private navCtrl: NavController) {}

  viewDetails(order: any) {
    this.navCtrl.navigateForward('/admin/admin-order-detail', {
      state: { order }
    });

  }

  search(event: any) {
    const term = event.detail.value.toLowerCase();
    this.filteredOrders = this.orders.filter(order =>
      order.id.toLowerCase().includes(term) ||
      order.retailer.name.toLowerCase().includes(term)
    );
  }
}