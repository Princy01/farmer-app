import { Component, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { IonicModule, NavController, IonContent, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import { filterOutline, alertCircleOutline, receiptOutline, closeCircleOutline, chevronDownOutline, walletOutline } from 'ionicons/icons';
import { WholesalerApiService, OrderItemDetails } from '../services/wholesaler-api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  OrderPostDeliveryStatus,
  getPostDeliveryColor,
  getPostDeliveryLabelKey,
  hasPostDeliveryStatus,
} from 'src/app/shared/order-post-delivery-status';

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
export class PastOrdersComponent implements AfterViewInit, OnDestroy {
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
  selectedFilter: string = 'all';
  selectedOrderId: number | null = null;
  isLoading: boolean = false;
  hasError: boolean = false;

  private originalOrders: OrderItemDetails[] = [];
  private subscriptions = new Subscription();

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
    addIcons({ filterOutline, alertCircleOutline, receiptOutline, closeCircleOutline, chevronDownOutline, walletOutline });
  }

  ngAfterViewInit(): void {
    this.content.scrollEvents = true;
    this.checkAuthAndLoadData();
  }

  /**
   * Cleanup subscriptions to prevent memory leaks
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Validates authentication and authorization before loading data
   */
  private checkAuthAndLoadData(): void {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    if (!this.authService.hasRole('wholesaler')) {
      this.showUnauthorizedError();
      return;
    }

    this.loadCompletedOrders();
  }

  /**
   * Displays authentication error and redirects to login
   */
  private async showAuthError(): Promise<void> {
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
      ],
      backdropDismiss: false
    });
    await alert.present();
  }

  /**
   * Displays unauthorized access error
   */
  private async showUnauthorizedError(): Promise<void> {
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
      ],
      backdropDismiss: false
    });
    await alert.present();
  }

  /**
   * Loads completed orders from the API
   * @param daysAgo Optional number of days to filter by
   */
  async loadCompletedOrders(daysAgo?: number): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      await this.showAuthError();
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

      const subscription = this.wholesalerApiService.getCompletedOrders(undefined, daysAgo).subscribe({
        next: async (orders) => {
          this.originalOrders = orders;
          this.completedOrders = orders;
          await loading.dismiss();
          this.isLoading = false;

          if (orders.length === 0) {
            await this.showToast(this.translate.instant('PAST_ORDERS.NO_ORDERS'));
          }
        },
        error: async (error) => {
          await loading.dismiss();
          this.isLoading = false;
          this.hasError = true;

          if (error?.status === 401) {
            await this.showAuthError();
            return;
          }

          await this.showError(
            this.translate.instant('PAST_ORDERS.LOAD_ERROR'),
            this.translate.instant('PAST_ORDERS.TRY_LATER')
          );
        }
      });

      this.subscriptions.add(subscription);
    } catch (error) {
      await loading.dismiss();
      this.isLoading = false;
      this.hasError = true;

      await this.showError(
        this.translate.instant('PAST_ORDERS.UNEXPECTED_ERROR'),
        this.translate.instant('PAST_ORDERS.TRY_LATER')
      );
    }
  }

  /**
   * Displays a toast message
   * @param message The message to display
   */
  async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'medium'
    });
    await toast.present();
  }

  hasPostDelivery(status?: OrderPostDeliveryStatus | null): boolean {
    return hasPostDeliveryStatus(status);
  }

  getPostDeliveryColor(status?: OrderPostDeliveryStatus | null): string {
    return getPostDeliveryColor(status);
  }

  getPostDeliveryLabel(status?: OrderPostDeliveryStatus | null): string {
    const key = getPostDeliveryLabelKey(status);
    if (key) {
      const translated = this.translate.instant(key);
      if (translated !== key) {
        return translated;
      }
    }
    return status?.return_status_description ||
      status?.return_status_name ||
      status?.dispute_status ||
      status?.finance_exception_status ||
      '';
  }

  /**
   * Displays an error alert with retry option
   * @param header The alert header
   * @param message The error message
   */
  async showError(header: string, message: string): Promise<void> {
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

  /**
   * Applies the selected filter to orders
   * @param filter The filter value to apply
   */
  async applyFilter(filter: string): Promise<void> {
    if (!filter || filter === 'all') {
      this.selectedFilter = 'all';
      await this.loadCompletedOrders();
      return;
    }

    this.selectedFilter = filter;

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
        await this.loadCompletedOrders();
    }
  }

  /**
   * Shows custom date range filter dialog
   */
  private async showCustomDateFilter(): Promise<void> {
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
            this.selectedFilter = 'all';
            this.completedOrders = this.originalOrders;
          }
        },
        {
          text: this.translate.instant('PAST_ORDERS.FILTER'),
          handler: (data: any) => {
            if (!data.startDate || !data.endDate) {
              this.showToast(this.translate.instant('PAST_ORDERS.SELECT_DATES'));
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

  /**
   * Filters orders by custom date range
   * @param startDate Start date of the range
   * @param endDate End date of the range
   */
  private async filterByDateRange(startDate: Date, endDate: Date): Promise<void> {
    if (!startDate || !endDate) {
      await this.showToast(this.translate.instant('PAST_ORDERS.SELECT_DATES'));
      this.selectedFilter = 'all';
      this.completedOrders = [...this.originalOrders];
      return;
    }

    // Validate date range
    if (startDate > endDate) {
      await this.showToast(this.translate.instant('PAST_ORDERS.INVALID_DATE_RANGE'));
      this.selectedFilter = 'all';
      this.completedOrders = [...this.originalOrders];
      return;
    }

    // Set time to start and end of day for proper comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    this.completedOrders = this.originalOrders.filter(order => {
      if (!order.actual_delivery_date) return false;

      const orderDate = new Date(order.actual_delivery_date);
      return orderDate >= startDate && orderDate <= endDate;
    });

    if (this.completedOrders.length === 0) {
      await this.showToast(this.translate.instant('PAST_ORDERS.NO_ORDERS_IN_RANGE'));
    }
  }

  /**
   * Toggles order details expansion
   * @param order The order to expand/collapse
   */
  viewOrderDetails(order: OrderItemDetails): void {
    if (!order || !order.order_id) {
      return;
    }

    this.selectedOrderId = this.selectedOrderId === order.order_id ? null : order.order_id;
  }

  viewPaymentDetails(order: OrderItemDetails, event: Event): void {
    event.stopPropagation();
    if (!order?.order_id) {
      return;
    }
    this.router.navigate(['/wholesaler/earnings'], {
      queryParams: { orderId: order.order_id }
    });
  }

  /**
   * Track by function for order list performance
   * @param _index The index of the item
   * @param order The order item
   * @returns The unique order ID
   */
  trackById(_index: number, order: OrderItemDetails): number {
    return order.order_id;
  }

  /**
   * Handles pull-to-refresh gesture
   */
  async handleRefresh(event: any): Promise<void> {
    try {
      await this.loadCompletedOrders();
    } catch (error) {
      event?.target?.complete();
    }
  }

  /**
   * Clears the current filter and loads all orders
   */
  clearFilter(): void {
    this.selectedFilter = 'all';
    this.loadCompletedOrders();
  }
}
