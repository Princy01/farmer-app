import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import {
  searchOutline, ellipsisVertical, menuOutline, closeOutline, chevronDownCircleOutline,
  chevronForwardOutline, receiptOutline, refreshOutline, alertCircleOutline, homeOutline
} from 'ionicons/icons';
import { WholesalerApiService } from '../services/wholesaler-api.service';
import {
  OrderPostDeliveryStatus,
  getPostDeliveryColor,
  getPostDeliveryLabelKey,
  hasPostDeliveryStatus,
} from 'src/app/shared/order-post-delivery-status';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

enum OrderFilter {
  DATE = 'date',
  PRICE_HIGH = 'price_high',
  PRICE_LOW = 'price_low',
  BULK = 'bulk',
  PRODUCT = 'product'
}

interface DisplayOrder {
  id: number;
  items: string;
  total: number;
  postDelivery?: OrderPostDeliveryStatus | null;
  postDeliveryLabel?: string;
  postDeliveryColor?: string;
  postDeliveryNeedsAdminAction?: boolean;
}

@Component({
  selector: 'app-screen2',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe, RouterModule]
})

export class OrdersComponent implements OnInit, OnDestroy {
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
  isLoading: boolean = false;

  orders: DisplayOrder[] = [];
  filteredOrders: DisplayOrder[] = [];

  private destroy$ = new Subject<void>();
  private pollInterval: any;
  private searchSubject = new Subject<string>();

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
      chevronDownCircleOutline, chevronForwardOutline, receiptOutline, refreshOutline, alertCircleOutline, homeOutline
    });
  }

  ngOnInit() {
    this.setupSearchDebounce();
    this.checkAuthAndLoadData();
    this.startPolling();
  }

  /**
   * Setup search input debounce to prevent excessive filtering
   */
  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((searchTerm: string) => {
      this.performSearch(searchTerm);
    });
  }

  /**
   * Cleanup subscriptions to prevent memory leaks
   */
  ngOnDestroy() {
    this.stopPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkAuthAndLoadData(): void {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    if (!this.authService.hasRole('wholesaler')) {
      this.showUnauthorizedError();
      return;
    }

    this.loadOrders();
  }

  /**
   * Starts polling for order updates every 1 minute
   */
  private startPolling(): void {
    this.pollInterval = setInterval(() => {
      this.loadOrders();
    }, 60000);
  }

  /**
   * Stops polling for order updates
   */
  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private async showAuthError(): Promise<void> {
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
      ],
      backdropDismiss: false
    });
    await alert.present();
  }

  private async showUnauthorizedError(): Promise<void> {
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
      ],
      backdropDismiss: false
    });
    await alert.present();
  }

  /**
   * Toggles search bar visibility and resets search when closed
   */
  toggleSearch(): void {
    this.isSearchVisible = !this.isSearchVisible;
    if (!this.isSearchVisible) {
      this.searchTerm = '';
      this.filteredOrders = [...this.orders];
    }
  }

  /**
   * Filters orders based on search term (delegates to debounced handler)
   * Searches across order ID, total amount, and item descriptions
   */
  handleSearch(event: any): void {
    const searchTerm = event?.target?.value?.toLowerCase() || '';
    this.searchSubject.next(searchTerm);
  }

  /**
   * Performs the actual search after debounce
   */
  private performSearch(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredOrders = [...this.orders];
      return;
    }

    this.filteredOrders = this.orders.filter(order => {
      const orderId = order.id.toString();
      const orderTotal = order.total.toString();
      const orderItems = order.items.toLowerCase();

      return orderId.includes(searchTerm) ||
             orderTotal.includes(searchTerm) ||
             orderItems.includes(searchTerm);
    });
  }

  /**
   * Loads orders from the API and transforms them for display
   */
  async loadOrders(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      await this.showAuthError();
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('ORDERS_RECEIVED.LOADING'),
      spinner: 'circular'
    });

    try {
      await loading.present();

      this.wholesalerService.getOrderItemDetails()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.orders = data.map(order => ({
              id: order.order_id,
              items: this.formatOrderItems(order.order_items),
              total: order.total_order_amount,
              postDelivery: order.post_delivery ?? null,
              postDeliveryLabel: this.getPostDeliveryLabel(order.post_delivery),
              postDeliveryColor: getPostDeliveryColor(order.post_delivery),
              postDeliveryNeedsAdminAction: !!order.post_delivery?.needs_admin_action
            }));

            // Sort by order ID descending (most recent first)
            this.orders.sort((a, b) => b.id - a.id);

            this.filteredOrders = [...this.orders];
            this.isLoading = false;
            loading.dismiss();
          },
          error: async (error) => {
            this.isLoading = false;
            await loading.dismiss();

            // Handle authentication errors
            if (error?.status === 401) {
              await this.showAuthError();
              return;
            }

            // Handle other errors
            await this.showLoadError(error);
          }
        });
    } catch (err) {
      this.isLoading = false;
      await loading.dismiss();

      const alert = await this.alertCtrl.create({
        header: this.translate.instant('ORDERS_RECEIVED.ERROR'),
        message: this.translate.instant('ORDERS_RECEIVED.UNEXPECTED_ERROR'),
        buttons: [this.translate.instant('ORDERS_RECEIVED.OK')]
      });
      await alert.present();
    }
  }

  hasPostDelivery(status?: OrderPostDeliveryStatus | null): boolean {
    return hasPostDeliveryStatus(status);
  }

  private getPostDeliveryLabel(status?: OrderPostDeliveryStatus | null): string | undefined {
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
      undefined;
  }

  /**
   * Displays error alert with retry option
   */
  private async showLoadError(error: any): Promise<void> {
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

  private formatOrderItems(items: any[]): string {
    if (!items || items.length === 0) {
      return this.translate.instant('ORDERS_RECEIVED.NO_ITEMS');
    }

    return items.map((item, index) => {
      const itemLabel = this.translate.instant('ORDERS_RECEIVED.ITEM_LABEL', { number: index + 1 });
      const priceLabel = this.translate.instant('ORDERS_RECEIVED.PRICE_PER_UNIT', {
        price: item.max_item_price,
        unit: item.unit_name
      });

      return `${itemLabel}: ${item.product_name} - ${item.quantity} ${item.unit_name} (${priceLabel})`;
    }).join(';<br>');
  }

  /**
   * Handles filter selection changes
   */
  handleFilterChange(event: CustomEvent): void {
    const value = event?.detail?.value;
    if (value) {
      this.applyFilter(value);
    }
  }

  applyFilter(filter: OrderFilter): void {
    this.selectedFilter = filter;
    const BULK_ORDER_THRESHOLD = 750;

    switch (filter) {
      case OrderFilter.DATE:
        // Sort by order ID descending (most recent first)
        this.filteredOrders = [...this.orders].sort((a, b) => b.id - a.id);
        break;

      case OrderFilter.PRICE_HIGH:
        // Sort by total amount descending
        this.filteredOrders = [...this.orders].sort((a, b) => b.total - a.total);
        break;

      case OrderFilter.PRICE_LOW:
        // Sort by total amount ascending
        this.filteredOrders = [...this.orders].sort((a, b) => a.total - b.total);
        break;

      case OrderFilter.BULK:
        // Filter orders above bulk threshold
        this.filteredOrders = this.orders.filter(order => order.total > BULK_ORDER_THRESHOLD);
        break;

      case OrderFilter.PRODUCT:
        // Sort alphabetically by product items
        this.filteredOrders = [...this.orders].sort((a, b) =>
          a.items.localeCompare(b.items)
        );
        break;

      default:
        this.filteredOrders = [...this.orders];
    }
  }

  /**
   * Handles pull-to-refresh gesture
   */
  async handleRefresh(event: any): Promise<void> {
    try {
      await this.loadOrders();
    } finally {
      event?.target?.complete();
    }
  }

  /**
   * Navigates to order details page
   */
  viewDetails(order: DisplayOrder): void {
    if (!order || !order.id) {
      return;
    }

    this.router.navigate(['/wholesaler/order-details', order.id], {
      queryParams: { returnTo: '/wholesaler/orders' }
    });
  }
}