import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { IonicModule, NavController, IonContent, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { chatbubblesSharp, notificationsCircleSharp, logoAndroid, personCircleSharp, arrowBackCircleSharp } from 'ionicons/icons';
import { WholesalerApiService } from '../services/wholesaler-api.service';

interface OrderItem {
  order_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_id: number;
  unit_name: string;
  max_item_price: number;
}

interface OrderItemDetails {
  order_id: number;
  total_order_amount: number;
  order_items: OrderItem[];
  created_at?: string; // Add this field
}

@Component({
  selector: 'app-screen4',
  templateUrl: './screen4.component.html',
  styleUrls: ['./screen4.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class Screen4Component implements AfterViewInit {
  @ViewChild(IonContent) content!: IonContent;

  completedOrders: OrderItemDetails[] = [];
  filters = ['All Orders', '1 day ago', '2 days ago', '3 days ago', '4 days ago', 'Custom search'];
  selectedFilter: string | null = null;
  selectedOrderId: number | null = null;
  isLoading = false;
  hasError = false;

  private originalOrders: OrderItemDetails[] = [];
  customStartDate: string = '';
  customEndDate: string = '';

  notifications = 5;
  messages = 3;

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private wholesalerApiService: WholesalerApiService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      chatbubblesSharp,
      notificationsCircleSharp,
      logoAndroid,
      personCircleSharp,
      arrowBackCircleSharp
    });
    this.loadCompletedOrders();
  }

  ngAfterViewInit() {
    this.content.scrollEvents = true;
  }

  async loadCompletedOrders(daysAgo?: number) {
    const loading = await this.loadingCtrl.create({
      message: 'Loading orders...',
      spinner: 'circular'
    });

    try {
      await loading.present();
      this.isLoading = true;
      this.hasError = false;

      this.wholesalerApiService.getCompletedOrders(daysAgo).subscribe({
        next: async (orders) => {
          this.originalOrders = orders;
          this.completedOrders = orders;
          await loading.dismiss();
          this.isLoading = false;

          if (orders.length === 0) {
            this.showToast('No completed orders found');
          }
        },
        error: async (error) => {
          console.error('Error loading completed orders:', error);
          await loading.dismiss();
          this.isLoading = false;
          this.hasError = true;
          this.showError('Failed to load orders', error.message);
        }
      });
    } catch (error) {
      await loading.dismiss();
      this.isLoading = false;
      this.hasError = true;
      this.showError('Unexpected error', 'Please try again later');
    }
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'medium'
    });
    await toast.present();
  }

  async showError(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        },
        {
          text: 'Retry',
          handler: () => {
            this.loadCompletedOrders();
          }
        }
      ]
    });
    await alert.present();
  }

  async applyFilter(filter: string) {
    if (!filter || filter === 'All Orders') {
      this.selectedFilter = 'All Orders';
      this.completedOrders = this.originalOrders;
      return;
    }

    switch (filter) {
      case '1 day ago':
        await this.loadCompletedOrders(1);
        break;
      case '2 days ago':
        await this.loadCompletedOrders(2);
        break;
      case '3 days ago':
        await this.loadCompletedOrders(3);
        break;
      case '4 days ago':
        await this.loadCompletedOrders(4);
        break;
      case 'Custom search':
        await this.showCustomDateFilter();
        break;
      default:
        this.completedOrders = this.originalOrders;
    }
  }

  private async showCustomDateFilter() {
    const alert = await this.alertCtrl.create({
      header: 'Custom Date Range',
      inputs: [
        {
          name: 'startDate',
          type: 'date',
          label: 'Start Date'
        },
        {
          name: 'endDate',
          type: 'date',
          label: 'End Date'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            // Reset to All Orders if user cancels
            this.selectedFilter = 'All Orders';
            this.completedOrders = this.originalOrders;
          }
        },
        {
        text: 'Filter',
          handler: (data:any) => {
            if (!data.startDate || !data.endDate) {
              this.selectedFilter = 'All Orders';
              return false;
            }
            this.filterByDateRange(new Date(data.startDate), new Date(data.endDate));
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  private filterByDateRange(startDate: Date, endDate: Date) {
    if (!startDate || !endDate) {
      this.showToast('Please select both start and end dates');
      this.selectedFilter = 'All Orders';
      this.completedOrders = this.originalOrders;
      return;
    }

    this.completedOrders = this.originalOrders.filter(order => {
      const orderDate = new Date(order.created_at || '');
      return orderDate >= startDate && orderDate <= endDate;
    });

    if (this.completedOrders.length === 0) {
      this.showToast('No orders found in selected date range');
    }
  }

  viewOrderDetails(order: OrderItemDetails) {
    this.selectedOrderId = this.selectedOrderId === order.order_id ? null : order.order_id;
  }

  trackById(_index: number, order: OrderItemDetails) {
    return order.order_id;
  }

}