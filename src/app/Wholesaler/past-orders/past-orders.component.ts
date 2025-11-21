import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { IonicModule, NavController, IonContent, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { filterOutline, alertCircleOutline, receiptOutline, closeCircleOutline, chevronDownOutline } from 'ionicons/icons';
import { WholesalerApiService } from '../services/wholesaler-api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

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
  created_at?: string;
}

interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-past-orders',
  templateUrl: './past-orders.component.html',
  styleUrls: ['./past-orders.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe]
})
export class PastOrdersComponent implements AfterViewInit {
  @ViewChild(IonContent) content!: IonContent;

  completedOrders: OrderItemDetails[] = [];
  filters: FilterOption[] = [
    { value: 'all', label: 'PAST_ORDERS.FILTER_ALL' },
    { value: '1day', label: 'PAST_ORDERS.FILTER_1DAY' },
    { value: '2days', label: 'PAST_ORDERS.FILTER_2DAYS' },
    { value: '3days', label: 'PAST_ORDERS.FILTER_3DAYS' },
    { value: '4days', label: 'PAST_ORDERS.FILTER_4DAYS' },
    { value: 'custom', label: 'PAST_ORDERS.FILTER_CUSTOM' }
  ];
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
    private alertCtrl: AlertController,
    private authService: AuthService,
    private translate: TranslateService
  ) {
    addIcons({ filterOutline, alertCircleOutline, receiptOutline, closeCircleOutline, chevronDownOutline });
  }

  ngAfterViewInit() {
    this.content.scrollEvents = true;
    this.checkAuthAndLoadData();
  }

  // authentication check
  private checkAuthAndLoadData() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    // Check if user has wholesaler role
    if (!this.authService.hasRole('wholesaler')) {
      this.showUnauthorizedError();
      return;
    }

    this.loadCompletedOrders();
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PAST_ORDERS.AUTH_ERROR'),
      message: this.translate.instant('PAST_ORDERS.SESSION_EXPIRED'),
      buttons: [
        {
          text: this.translate.instant('PAST_ORDERS.OK'),
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
      header: this.translate.instant('PAST_ORDERS.ACCESS_DENIED'),
      message: this.translate.instant('PAST_ORDERS.NO_PERMISSION'),
      buttons: [
        {
          text: this.translate.instant('PAST_ORDERS.OK'),
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  async loadCompletedOrders(daysAgo?: number) {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('PAST_ORDERS.LOADING'),
      spinner: 'circular'
    });

    try {
      await loading.present();
      this.isLoading = true;
      this.hasError = false;

      // Call service without wholesaler ID - backend will get user_id from JWT
      this.wholesalerApiService.getCompletedOrders(undefined, daysAgo).subscribe({
        next: async (orders) => {
          this.originalOrders = orders;
          this.completedOrders = orders;
          await loading.dismiss();
          this.isLoading = false;

          if (orders.length === 0) {
            this.showToast(this.translate.instant('PAST_ORDERS.NO_ORDERS'));
          }
        },
        error: async (error) => {
          console.error('Error loading completed orders:', error);
          await loading.dismiss();
          this.isLoading = false;
          this.hasError = true;

          // Handle authentication errors
          if (error.status === 401) {
            this.showAuthError();
            return;
          }

          this.showError(
            this.translate.instant('PAST_ORDERS.LOAD_ERROR'),
            this.translate.instant('PAST_ORDERS.TRY_LATER')
          );
        }
      });
    } catch (error) {
      await loading.dismiss();
      this.isLoading = false;
      this.hasError = true;
      this.showError(
        this.translate.instant('PAST_ORDERS.UNEXPECTED_ERROR'),
        this.translate.instant('PAST_ORDERS.TRY_LATER')
      );
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
          text: this.translate.instant('PAST_ORDERS.DISMISS'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('PAST_ORDERS.RETRY'),
          handler: () => {
            this.loadCompletedOrders();
          }
        }
      ]
    });
    await alert.present();
  }

  async applyFilter(filter: string) {
    if (!filter || filter === 'all') {
      this.selectedFilter = 'all';
      this.completedOrders = this.originalOrders;
      return;
    }

    switch (filter) {
      case '1day':
        await this.loadCompletedOrders(1);
        break;
      case '2days':
        await this.loadCompletedOrders(2);
        break;
      case '3days':
        await this.loadCompletedOrders(3);
        break;
      case '4days':
        await this.loadCompletedOrders(4);
        break;
      case 'custom':
        await this.showCustomDateFilter();
        break;
      default:
        this.completedOrders = this.originalOrders;
    }
  }

  private async showCustomDateFilter() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PAST_ORDERS.CUSTOM_DATE_RANGE'),
      inputs: [
        {
          name: 'startDate',
          type: 'date',
          label: this.translate.instant('PAST_ORDERS.START_DATE')
        },
        {
          name: 'endDate',
          type: 'date',
          label: this.translate.instant('PAST_ORDERS.END_DATE')
        }
      ],
      buttons: [
        {
          text: this.translate.instant('PAST_ORDERS.CANCEL'),
          role: 'cancel',
          handler: () => {
            // Reset to All Orders if user cancels
            this.selectedFilter = 'all';
            this.completedOrders = this.originalOrders;
          }
        },
        {
          text: this.translate.instant('PAST_ORDERS.FILTER'),
          handler: (data: any) => {
            if (!data.startDate || !data.endDate) {
              this.selectedFilter = 'all';
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
      this.showToast(this.translate.instant('PAST_ORDERS.SELECT_DATES'));
      this.selectedFilter = 'all';
      this.completedOrders = this.originalOrders;
      return;
    }

    this.completedOrders = this.originalOrders.filter(order => {
      const orderDate = new Date(order.created_at || '');
      return orderDate >= startDate && orderDate <= endDate;
    });

    if (this.completedOrders.length === 0) {
      this.showToast(this.translate.instant('PAST_ORDERS.NO_ORDERS_IN_RANGE'));
    }
  }

  viewOrderDetails(order: OrderItemDetails) {
    this.selectedOrderId = this.selectedOrderId === order.order_id ? null : order.order_id;
  }

  trackById(_index: number, order: OrderItemDetails) {
    return order.order_id;
  }

  async handleRefresh(event: any) {
    try {
      await this.loadCompletedOrders();
    } finally {
      event.target.complete();
    }
  }
}