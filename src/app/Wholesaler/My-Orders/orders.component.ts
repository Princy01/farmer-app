import { Component, OnInit } from '@angular/core';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { searchOutline, ellipsisVertical, menuOutline } from 'ionicons/icons';
import { WholesalerApiService } from '../services/wholesaler-api.service';

enum OrderFilter {
  DATE = 'date',
  PRICE_HIGH = 'price_high',
  PRICE_LOW = 'price_low',
  BULK = 'bulk',
  PRODUCT = 'product'
}

@Component({
  selector: 'app-screen2',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})

export class OrdersComponent {
  filterOptions = [
    { name: 'All Orders', value: OrderFilter.DATE },
    { name: 'Price ↑', value: OrderFilter.PRICE_LOW },
    { name: 'Price ↓', value: OrderFilter.PRICE_HIGH },
    { name: 'Bulk Orders', value: OrderFilter.BULK },
    { name: 'By Product', value: OrderFilter.PRODUCT }
  ];

  selectedFilter = OrderFilter.DATE;
  searchTerm: string = '';
  isSearchVisible: boolean = false;

  // Example data
  // orders = [
  //   {id: 1, items: 'Item 1: Carrot - 25 Kg (Rs. 10/Kg);<br>Item 2: Carrot2 - 10 Kg (Rs. 15/Kg)', total: 400},
  //   { id: 2, items: 'Item 1: Spinach - 30 kg (Rs. 10/Kg);<br>Item 2: Carrot2 - 10Kg (Rs. 15/Kg)', total: 450 },
  //   { id: 3, items: 'Item 1: Onion - 20 kg (Rs. 20/Kg);<br>Item 2: Potato - 15 kg(Rs. 10/Kg)', total: 550 },
  //   { id: 4, items: 'Item 1: Tomato - 10 kg (Rs. 20/Kg)', total: 200 },
  // ];

  orders: any[] = [];
  filteredOrders: any[] = [];

  constructor(
    private wholesalerService: WholesalerApiService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) {
    addIcons({
      searchOutline,
      ellipsisVertical,
      menuOutline
    });
  }

  ngOnInit() {
    this.loadOrders();
  }

  toggleSearch() {
    this.isSearchVisible = !this.isSearchVisible;
    if (!this.isSearchVisible) {
      this.searchTerm = '';
      this.filteredOrders = [...this.orders];
    }
  }

  handleSearch(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    if (!searchTerm.trim()) {
      this.filteredOrders = [...this.orders];
      return;
    }

    this.filteredOrders = this.orders.filter(order => {
      // Search in order ID
      if (order.id.toString().includes(searchTerm)) return true;
      // Search in total amount
      if (order.total.toString().includes(searchTerm)) return true;
      // Search in items
      if (order.items.toLowerCase().includes(searchTerm)) return true;
      return false;
    });
  }

  async loadOrders() {
    const loading = await this.loadingCtrl.create({
      message: 'Loading orders...',
      spinner: 'circular'
    });

    try {
      await loading.present();

      this.wholesalerService.getOrderItemDetails().subscribe({
        next: (data) => {
          this.orders = data.map(order => ({
            id: order.order_id,
            items: this.formatOrderItems(order.order_items),
            total: order.total_order_amount
          }));
          this.filteredOrders = [...this.orders];
          loading.dismiss();
        },
        error: async (error) => {
          loading.dismiss();
          const alert = await this.alertCtrl.create({
            header: 'Error',
            message: 'Failed to load orders. Please try again.',
            buttons: [
              {
                text: 'OK',
                role: 'cancel'
              },
              {
                text: 'Retry',
                handler: () => {
                  this.loadOrders();
                }
              }
            ]
          });
          await alert.present();
        }
      });
    } catch (err) {
      loading.dismiss();
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'An unexpected error occurred.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  private formatOrderItems(items: any[]): string {
    return items.map((item, index) =>
      `Item ${index + 1}: ${item.product_name} - ${item.quantity} ${item.unit_name} (Rs. ${item.max_item_price}/${item.unit_name})`
    ).join(';<br>');
  }

  handleFilterChange(event: CustomEvent) {
    const value = event.detail.value;
    if (value) {
      this.applyFilter(value);
    }
  }

  applyFilter(filter: OrderFilter) {
    this.selectedFilter = filter;

    switch (filter) {

      case OrderFilter.DATE:
        this.filteredOrders = [...this.orders].sort((a, b) => b.id - a.id); // Assuming newer orders have higher IDs
        break;

      case OrderFilter.PRICE_HIGH:
        this.filteredOrders = [...this.orders].sort((a, b) => b.total - a.total);
        break;

      case OrderFilter.PRICE_LOW:
        this.filteredOrders = [...this.orders].sort((a, b) => a.total - b.total);
        break;

      case OrderFilter.BULK:
        this.filteredOrders = this.orders.filter(order => order.total > 750);
        break;

      case OrderFilter.PRODUCT:
        // Group orders by product
        this.filteredOrders = this.orders.sort((a, b) =>
          a.items.localeCompare(b.items)
        );
        break;
    }
  }

  async handleRefresh(event: any) {
    try {
      await this.loadOrders();
    } finally {
      event.target.complete();
    }
  }
}
