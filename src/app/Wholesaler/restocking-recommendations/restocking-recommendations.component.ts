import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircle,
  trendingDown,
  trendingUp,
  calendar,
  analytics,
  storefront,
  chevronDown,
  chevronUp,
  checkmarkCircle,
  bulb
} from 'ionicons/icons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WholesalerApiService, RestockProduct } from '../services/wholesaler-api.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-restocking-recommendations',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslatePipe, FormsModule],
  templateUrl: './restocking-recommendations.component.html',
  styleUrls: ['./restocking-recommendations.component.scss']
})
export class RestockingRecommendationsComponent implements OnInit, OnDestroy {
  products: RestockProduct[] = [];
  filteredProductsCache: RestockProduct[] = [];
  isLoading = false;
  error: string | null = null;
  daysBack = 30;
  expandedProducts: Set<number> = new Set();

  private destroy$ = new Subject<void>();

  filterOptions = [
    { value: 7, label: 'RESTOCK_RECS.LAST_7_DAYS' },
    { value: 14, label: 'RESTOCK_RECS.LAST_14_DAYS' },
    { value: 30, label: 'RESTOCK_RECS.LAST_30_DAYS' },
    { value: 60, label: 'RESTOCK_RECS.LAST_60_DAYS' },
    { value: 90, label: 'RESTOCK_RECS.LAST_90_DAYS' }
  ];

  constructor(
    private wholesalerService: WholesalerApiService,
    private router: Router,
    private alertCtrl: AlertController,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private translate: TranslateService
  ) {
    addIcons({
      alertCircle,
      trendingDown,
      trendingUp,
      calendar,
      analytics,
      storefront,
      chevronDown,
      chevronUp,
      checkmarkCircle,
      bulb
    });
  }

  ngOnInit() {
    this.checkAuthAndLoadData();
  }

  /**
   * Cleanup subscriptions to prevent memory leaks
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Validates authentication and authorization before loading data
   */
  private checkAuthAndLoadData() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    if (!this.authService.hasRole('wholesaler')) {
      this.showUnauthorizedError();
      return;
    }

    this.loadRestockingRecommendations();
  }

  /**
   * Shows an authentication error alert and redirects to login
   */
  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RESTOCK_RECS.AUTH_ERROR'),
      message: this.translate.instant('RESTOCK_RECS.SESSION_EXPIRED'),
      buttons: [
        {
          text: this.translate.instant('RESTOCK_RECS.OK'),
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Shows an unauthorized access error alert and redirects to login
   */
  private async showUnauthorizedError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RESTOCK_RECS.ACCESS_DENIED'),
      message: this.translate.instant('RESTOCK_RECS.NO_PERMISSION'),
      buttons: [
        {
          text: this.translate.instant('RESTOCK_RECS.OK'),
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Loads restocking recommendations from the backend
   */
  async loadRestockingRecommendations() {
    if (!this.authService.isAuthenticated()) {
      await this.showAuthError();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('RESTOCK_RECS.LOADING_RECOMMENDATIONS'),
      spinner: 'circular',
    });

    try {
      await loading.present();
      this.isLoading = true;
      this.error = null;

      this.wholesalerService.getRestockingRecommendations(this.daysBack)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (data) => {
            this.products = data;
            this.updateFilteredProducts();
            this.isLoading = false;
            await loading.dismiss();

            if (data.length === 0) {
              await this.showToast(
                this.translate.instant('RESTOCK_RECS.NO_RESTOCK_NEEDED'),
                'success'
              );
            }
          },
          error: async (error) => {
            console.error('Failed to load restocking recommendations:', error);
            this.isLoading = false;
            await loading.dismiss();

            if (error.status === 401) {
              await this.showAuthError();
              return;
            }

            this.error = this.translate.instant('RESTOCK_RECS.ERRORS.LOAD_ERROR');
            await this.showErrorAlert();
          }
        });
    } catch (error) {
      await loading.dismiss();
      this.isLoading = false;
      console.error('Error in loadRestockingRecommendations:', error);

      const alert = await this.alertCtrl.create({
        header: this.translate.instant('RESTOCK_RECS.ERRORS.UNEXPECTED_ERROR'),
        message: this.translate.instant('RESTOCK_RECS.ERRORS.TRY_LATER'),
        buttons: [this.translate.instant('RESTOCK_RECS.OK')]
      });
      await alert.present();
    }
  }

  /**
   * Shows an error alert with retry option
   */
  private async showErrorAlert() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RESTOCK_RECS.ERROR_TITLE'),
      message: this.translate.instant('RESTOCK_RECS.LOAD_ERROR'),
      buttons: [
        {
          text: this.translate.instant('RESTOCK_RECS.DISMISS'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('RESTOCK_RECS.RETRY'),
          handler: () => this.loadRestockingRecommendations()
        }
      ]
    });
    await alert.present();
  }

  /**
   * Handles time period filter change
   */
  onDaysBackChange() {
    this.loadRestockingRecommendations();
  }

  /**
   * Toggles the expanded state of a product card
   * @param productId The ID of the product to toggle
   */
  toggleProductExpand(productId: number) {
    if (this.expandedProducts.has(productId)) {
      this.expandedProducts.delete(productId);
    } else {
      this.expandedProducts.add(productId);
    }
  }

  /**
   * Checks if a product card is expanded
   * @param productId The ID of the product to check
   * @returns True if the product is expanded
   */
  isProductExpanded(productId: number): boolean {
    return this.expandedProducts.has(productId);
  }

  /**
   * Determines the badge color based on product stock status
   * @param product The product to evaluate
   * @returns The color string for the badge
   */
  getBadgeColor(product: RestockProduct): string {
    if (product.days_until_stockout < 7) return 'danger';
    if (product.stock_to_sales_ratio < 2) return 'danger';
    if (product.stock_to_sales_ratio < 4) return 'warning';
    return 'success';
  }

  /**
   * Gets the urgency icon based on product status
   * @param product The product to evaluate
   * @returns The icon name
   */
  getUrgencyIcon(product: RestockProduct): string {
    if (product.days_until_stockout < 7) return 'alert-circle';
    if (product.stock_to_sales_ratio < 2) return 'trending-down';
    if (product.stock_to_sales_ratio < 4) return 'trending-up';
    return 'checkmark-circle';
  }

  /**
   * Updates the filtered products cache
   * Filters products that need restocking and sorts by urgency
   */
  private updateFilteredProducts() {
    this.filteredProductsCache = this.products
      .filter(product => product.stock_to_sales_ratio < 4 || product.days_until_stockout < 30)
      .sort((a, b) => a.days_until_stockout - b.days_until_stockout);
  }

  /**
   * Returns the cached filtered products list
   * @returns Array of filtered products
   */
  filteredProducts(): RestockProduct[] {
    return this.filteredProductsCache;
  }

  /**
   * Gets count of critical products (less than 7 days until stockout)
   * @returns Number of critical products
   */
  getCriticalProducts(): number {
    return this.products.filter(p => p.days_until_stockout < 7).length;
  }

  /**
   * Gets count of low stock products
   * @returns Number of low stock products
   */
  getLowStockProducts(): number {
    return this.products.filter(p => p.stock_to_sales_ratio < 2 && p.days_until_stockout >= 7).length;
  }

  /**
   * Gets count of products that need restocking soon
   * @returns Number of products to restock soon
   */
  getRestockSoonProducts(): number {
    return this.products.filter(p => p.stock_to_sales_ratio >= 2 && p.stock_to_sales_ratio < 4).length;
  }

  /**
   * Handles pull-to-refresh event
   * @param event The refresh event
   */
  async handleRefresh(event: any) {
    try {
      await this.loadRestockingRecommendations();
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      event.target.complete();
    }
  }

  /**
   * Displays a toast message
   * @param message The message to display
   * @param color The color of the toast
   */
  private async showToast(message: string, color: 'success' | 'danger' | 'warning' | 'medium' = 'medium') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      color
    });
    await toast.present();
  }

  /**
   * Navigates back to the wholesaler home page
   */
  goBack() {
    this.router.navigate(['/wholesaler/home']);
  }
}