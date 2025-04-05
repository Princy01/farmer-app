import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  ellipsisVertical,
  menuOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-screen2',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class OrdersComponent {
  filterOptions = [
    { name: 'All', value: 'all' },
    { name: 'Bulk', value: 'bulk' },
    { name: 'Others', value: 'others' },
    { name: 'Desc / Asc Price', value: 'price' },
    { name: 'Create My Own List', value: 'custom' },
    { name: 'Item Wise', value: 'itemwise' },
  ];

  selectedFilter = 'all';

  // Example data
  orders = [
    {id: 1, items: 'Item 1: Carrot - 25 Kg (Rs. 10/Kg);<br>Item 2: Carrot2 - 10 Kg (Rs. 15/Kg)', total: 400},
    { id: 2, items: 'Item 1: Spinach - 30 kg (Rs. 10/Kg);<br>Item 2: Carrot2 - 10Kg (Rs. 15/Kg)', total: 450 },
    { id: 3, items: 'Item 1: Onion - 20 kg (Rs. 20/Kg);<br>Item 2: Potato - 15 kg(Rs. 10/Kg)', total: 550 },
    { id: 4, items: 'Item 1: Tomato - 10 kg (Rs. 20/Kg)', total: 200 },
  ];

  handleFilterChange(event: CustomEvent) {
    const value = event.detail.value;
    if (value) {
      this.applyFilter(value);
    }
  }

  filteredOrders = [...this.orders];

  applyFilter(filter: string) {
    this.selectedFilter = filter;

    switch (filter) {
      case 'all':
        this.filteredOrders = [...this.orders];
        break;

      case 'bulk':
        this.filteredOrders = this.orders.filter(order => order.total > 750);
        break;

      case 'others':
        this.filteredOrders = this.orders.filter(order => order.total <= 750);
        break;

      case 'price':
        this.filteredOrders = [...this.orders].sort((a, b) => a.total - b.total); // Ascending by default
        break;

      case 'custom':
        // Custom logic for selecting a manual list (simulate selected items for now)
        this.filteredOrders = [
          { id: 3, items: 'Onion 20 kg + Potato 15 kg', total: 1000 },
        ];
        break;

    }
  }
  constructor() {
    addIcons({
      searchOutline,
      ellipsisVertical,
      menuOutline
    });
  }
}