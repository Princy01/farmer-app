import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  cubeOutline,
  person,
  personCircle,
  call,
  cube,
  eyeOff,
  checkmarkCircle,
  eyeOutline,
  calendarOutline,
  locationOutline,
  cashOutline,
  checkmarkDoneCircle
} from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { WholesalerOrderService, WholesalerOrderSummary, WholesalerOrderDetails, OrderStatus } from './pickup-orders.service';

interface PickupOrder extends WholesalerOrderSummary {
  driverName?: string;
  driverPhone?: string;
  totalWeight: string;
  otp?: string;
  canGenerateOtp?: boolean;
}
@Component({
  selector: 'app-wholesaler-pickup-orders',
  templateUrl: './pickup-orders.component.html',
  styleUrls: ['./pickup-orders.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe],
})
export class WholesalerPickupOrdersComponent implements OnInit, OnDestroy {
  orders: PickupOrder[] = [];
  groupedOrders: { date: string, orders: PickupOrder[] }[] = [];
  otpVisible: { [orderId: string]: boolean } = {};
  viewMode: 'list' | 'details' = 'list';
  selectedOrderDetails: WholesalerOrderDetails | null = null;
  orderStatuses: OrderStatus[] = [];
  selectedStatuses: number[] = [];
  isLoading = false;
  hasError = false;

  selectedOrder: PickupOrder | null = null;
  private readonly OTP_ALLOWED_STATUSES = [1, 2, 3];

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private orderService: WholesalerOrderService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private translate: TranslateService
  ) {
    addIcons({
      arrowBack,
      cubeOutline,
      person,
      personCircle,
      call,
      cube,
      eyeOff,
      checkmarkCircle,
      eyeOutline,
      calendarOutline,
      locationOutline,
      cashOutline,
      checkmarkDoneCircle
    });
  }

  ngOnInit() {
    this.loadOrderStatuses();
  }

  /**
   * Cleanup subscriptions to prevent memory leaks
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads available order statuses from the backend
   */
  async loadOrderStatuses() {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('PICKUP_ORDERS.LOADING'),
      spinner: 'circular'
    });

    try {
      await loading.present();
      this.hasError = false;

      this.orderService.getOrderStatuses()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (data) => {
            this.orderStatuses = data;
            this.selectedStatuses = data.map(s => s.order_status_id);
            await loading.dismiss();
            await this.loadOrders();
          },
          error: async (err) => {
            console.error('Failed to load order statuses:', err);
            await loading.dismiss();
            this.hasError = true;
            await this.showError(
              this.translate.instant('PICKUP_ORDERS.ERRORS.LOAD_STATUSES_FAILED'),
              err.message || 'PICKUP_ORDERS.ERRORS.GENERIC'
            );
          }
        });
    } catch (error) {
      await loading.dismiss();
      console.error('Error in loadOrderStatuses:', error);
    }
  }

  /**
   * Loads wholesaler orders based on selected status filters
   */
  async loadOrders() {
    if (this.selectedStatuses.length === 0) {
      this.orders = [];
      this.groupOrdersByDate();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('PICKUP_ORDERS.LOADING_ORDERS'),
      spinner: 'circular'
    });

    try {
      await loading.present();
      this.isLoading = true;
      this.hasError = false;

      this.orderService.getWholesalerOrders(this.selectedStatuses)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (data) => {
            this.orders = data.map(order => ({
              ...order,
              totalWeight: `${order.total_quantity} ${this.translate.instant('PICKUP_ORDERS.KG')}`,
              driverName: this.translate.instant('PICKUP_ORDERS.NOT_ASSIGNED'),
              driverPhone: this.translate.instant('PICKUP_ORDERS.NOT_ASSIGNED'),
              canGenerateOtp: this.OTP_ALLOWED_STATUSES.includes(order.order_status_id)
            }));
            this.groupOrdersByDate();
            await loading.dismiss();
            this.isLoading = false;

            if (data.length === 0) {
              await this.showToast(this.translate.instant('PICKUP_ORDERS.NO_ORDERS'));
            }
          },
          error: async (err) => {
            console.error('Failed to load orders:', err);
            await loading.dismiss();
            this.isLoading = false;
            this.hasError = true;
            await this.showError(
              this.translate.instant('PICKUP_ORDERS.ERRORS.LOAD_ORDERS_FAILED'),
              this.translate.instant(err.message) || this.translate.instant('PICKUP_ORDERS.ERRORS.GENERIC')
            );
          }
        });
    } catch (error) {
      await loading.dismiss();
      this.isLoading = false;
      console.error('Error in loadOrders:', error);
    }
  }


  /**
   * Groups orders by their order date
   */
  groupOrdersByDate() {
    const groups: { [date: string]: PickupOrder[] } = {};
    this.orders.forEach(order => {
      const date = order.date_of_order.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(order);
    });

    this.groupedOrders = Object.keys(groups)
      .sort((a, b) => {
        const dateA = new Date(a).getTime();
        const dateB = new Date(b).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return groups[b][0].order_id - groups[a][0].order_id;
      })
      .map(date => ({
        date,
        orders: groups[date].sort((a, b) => b.order_id - a.order_id)
      }));
  }

  /**
   * Returns a localized date label for grouping
   * @param date The date string in ISO format
   * @returns A user-friendly date label
   */
  getDateLabel(date: string): string {
    const today = new Date();
    const d = new Date(date);
    if (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    ) {
      return this.translate.instant('PICKUP_ORDERS.TODAY');
    }
    return d.toLocaleDateString(this.translate.currentLang || 'en', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Handles status filter change event
   * @param selectedValues Array of selected status IDs
   */
  async onStatusFilterChange(selectedValues: number[]) {
    this.selectedStatuses = selectedValues;
    await this.loadOrders();
  }

  /**
   * Loads and displays detailed information for a specific order
   * @param order The order to view details for
   */
  async viewOrderDetails(order: PickupOrder) {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('PICKUP_ORDERS.LOADING_DETAILS'),
      spinner: 'circular'
    });

    try {
      await loading.present();

      this.orderService.getWholesalerOrderDetails(order.order_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (data) => {
            this.selectedOrderDetails = data;
            this.selectedOrder = order;
            this.viewMode = 'details';
            await loading.dismiss();
          },
          error: async (err) => {
            console.error('Failed to load order details:', err);
            await loading.dismiss();
            await this.showError(
              this.translate.instant('PICKUP_ORDERS.ERRORS.LOAD_DETAILS_FAILED'),
              this.translate.instant(err.message) || this.translate.instant('PICKUP_ORDERS.ERRORS.GENERIC')
            );
          }
        });
    } catch (error) {
      await loading.dismiss();
      console.error('Error in viewOrderDetails:', error);
    }
  }

  /**
   * Returns to the order list view
   */
  goBackToList() {
    this.viewMode = 'list';
    this.selectedOrderDetails = null;
    this.selectedOrder = null;
  }

  /**
   * Generates a pickup OTP for the specified order
   * @param order The order to generate OTP for
   */
  async generateOtp(order: PickupOrder, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (!order.canGenerateOtp) {
      await this.showToast(
        this.translate.instant('PICKUP_ORDERS.ERRORS.CANNOT_GENERATE_OTP'),
        'warning'
      );
      return;
    }
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('PICKUP_ORDERS.GENERATING_OTP'),
      spinner: 'circular'
    });

    try {
      await loading.present();

      this.orderService.generatePickupOtp(order.order_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (data) => {
            order.otp = data.otp_code;
            order.order_status = 'otp_generated';
            this.otpVisible[order.order_id.toString()] = false;
            await loading.dismiss();
            await this.showToast(
              this.translate.instant('PICKUP_ORDERS.OTP_GENERATED_SUCCESS'),
              'success'
            );
          },
          error: async (err) => {
            console.error('Failed to generate OTP:', err);
            await loading.dismiss();
            await this.showError(
              this.translate.instant('PICKUP_ORDERS.ERRORS.GENERATE_OTP_FAILED'),
              this.translate.instant(err.message) || this.translate.instant('PICKUP_ORDERS.ERRORS.GENERIC')
            );
          }
        });
    } catch (error) {
      await loading.dismiss();
      console.error('Error in generateOtp:', error);
    }
  }

  getStatusColor(statusId: number): string {
    const colors: { [key: number]: string } = {
      1: 'warning', 2: 'primary', 3: 'secondary', 4: 'danger',
      5: 'success', 6: 'danger', 7: 'medium', 8: 'tertiary',
      9: 'medium', 10: 'danger'
    };
    return colors[statusId] || 'medium';
  }

  /**
   * Toggles OTP visibility for a specific order
   * @param order The order to toggle OTP visibility for
   */
  toggleOtpVisibility(order: PickupOrder, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const orderId = order.order_id.toString();
    this.otpVisible[orderId] = !this.otpVisible[orderId];
  }

  /**
   * Hides the OTP for a specific order
   * @param order The order to hide OTP for
   */
  hideOtp(order: PickupOrder) {
    this.otpVisible[order.order_id.toString()] = false;
  }

  /**
   * Displays a toast message
   * @param message The message to display
   * @param color The color of the toast (success, danger, medium)
   */
  private async showToast(message: string, color: 'success' | 'danger' | 'medium' | 'warning' = 'medium') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });
    await toast.present();
  }

  /**
   * Displays an error alert with retry option
   * @param header The alert header
   * @param message The error message
   */
  private async showError(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [
        {
          text: this.translate.instant('PICKUP_ORDERS.DISMISS'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('PICKUP_ORDERS.RETRY'),
          handler: () => {
            this.loadOrders();
          }
        }
      ]
    });
    await alert.present();
  }
}