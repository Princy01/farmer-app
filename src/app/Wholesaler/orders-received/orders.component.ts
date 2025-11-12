import { Component, OnInit } from '@angular/core';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  searchOutline, ellipsisVertical, menuOutline, closeOutline, chevronDownCircleOutline,
  chevronForwardOutline, receiptOutline
} from 'ionicons/icons';
import { WholesalerApiService } from '../services/wholesaler-api.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

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
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe]
})

export class OrdersComponent {
  filterOptions = [
    { name: 'ORDERS_RECEIVED.FILTER_ALL', value: OrderFilter.DATE },
    { name: 'ORDERS_RECEIVED.FILTER_PRICE_LOW', value: OrderFilter.PRICE_LOW },
    { name: 'ORDERS_RECEIVED.FILTER_PRICE_HIGH', value: OrderFilter.PRICE_HIGH },
    { name: 'ORDERS_RECEIVED.FILTER_BULK', value: OrderFilter.BULK },
    { name: 'ORDERS_RECEIVED.FILTER_PRODUCT', value: OrderFilter.PRODUCT }
  ];

  selectedFilter = OrderFilter.DATE;
  searchTerm: string = '';
  isSearchVisible: boolean = false;

  orders: any[] = [];
  filteredOrders: any[] = [];

  constructor(
    private wholesalerService: WholesalerApiService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private router: Router,
    private authService: AuthService,
    private translate: TranslateService

  ) {
    addIcons({
      searchOutline, ellipsisVertical, menuOutline, closeOutline,
      chevronDownCircleOutline, chevronForwardOutline, receiptOutline
    });
  }

  ngOnInit() {
    this.checkAuthAndLoadData();
  }

  // authentication check
  private checkAuthAndLoadData() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    // Check if user has wholesaler role
    const userRole = this.authService.getUserRole();
    if (!this.authService.hasRole('wholesaler')) {
      this.showUnauthorizedError();
      return;
    }

    this.loadOrders();
  }

   private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('ORDERS_RECEIVED.AUTH_ERROR'),
      message: this.translate.instant('ORDERS_RECEIVED.SESSION_EXPIRED'),
      buttons: [
        {
          text: this.translate.instant('ORDERS_RECEIVED.OK'),
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async showUnauthorizedError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('ORDERS_RECEIVED.ACCESS_DENIED'),
      message: this.translate.instant('ORDERS_RECEIVED.NO_PERMISSION'),
      buttons: [
        {
          text: this.translate.instant('ORDERS_RECEIVED.OK'),
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
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
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('ORDERS_RECEIVED.LOADING'),
      spinner: 'circular'
    });

    try {
      await loading.present();

      // Call service without wholesaler ID - backend will get user_id from JWT
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

          // Handle authentication errors
          if (error.status === 401) {
            this.showAuthError();
            return;
          }

          const alert = await this.alertCtrl.create({
            header: this.translate.instant('ORDERS_RECEIVED.ERROR'),
            message: this.translate.instant('ORDERS_RECEIVED.LOAD_ERROR'),
            buttons: [
              {
                text: this.translate.instant('ORDERS_RECEIVED.DISMISS'),
                role: 'cancel'
              },
              {
                text: this.translate.instant('ORDERS_RECEIVED.RETRY'),
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
        header: this.translate.instant('ORDERS_RECEIVED.ERROR'),
        message: this.translate.instant('ORDERS_RECEIVED.UNEXPECTED_ERROR'),
        buttons: [this.translate.instant('ORDERS_RECEIVED.OK')]
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

  viewDetails(order: any) {
    this.router.navigate(['/wholesaler/order-details', order.id]);
  }
}