import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  alertCircle, 
  trendingDown, 
  trendingUp, 
  calendar,
  analytics,
  storefront,
  chevronDown,
  chevronUp
} from 'ionicons/icons';
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
export class RestockingRecommendationsComponent implements OnInit {
  products: RestockProduct[] = [];
  isLoading = false;
  error: string | null = null;
  daysBack = 30;
  expandedProducts: Set<number> = new Set();
  
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
      chevronUp
    });
  }

  ngOnInit() {
    this.checkAuthAndLoadData();
  }

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

  async loadRestockingRecommendations() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
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

      this.wholesalerService.getRestockingRecommendations(this.daysBack).subscribe({
        next: (data) => {
          this.products = data;
          this.isLoading = false;
          loading.dismiss();
        },
        error: async (error) => {
          console.error('Failed to load restocking recommendations:', error);
          this.isLoading = false;
          loading.dismiss();

          if (error.status === 401) {
            this.showAuthError();
            return;
          }

          this.error = this.translate.instant('RESTOCK_RECS.LOAD_ERROR');
          this.showErrorAlert();
        }
      });
    } catch {
      loading.dismiss();
      this.isLoading = false;
      const alert = await this.alertCtrl.create({
        header: this.translate.instant('RESTOCK_RECS.UNEXPECTED_ERROR'),
        message: this.translate.instant('RESTOCK_RECS.TRY_LATER'),
        buttons: [this.translate.instant('RESTOCK_RECS.OK')]
      });
      await alert.present();
    }
  }

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

  onDaysBackChange() {
    this.loadRestockingRecommendations();
  }

  toggleProductExpand(productId: number) {
    if (this.expandedProducts.has(productId)) {
      this.expandedProducts.delete(productId);
    } else {
      this.expandedProducts.add(productId);
    }
  }

  isProductExpanded(productId: number): boolean {
    return this.expandedProducts.has(productId);
  }

  getBadgeColor(product: RestockProduct): string {
    if (product.days_until_stockout < 7) return 'danger';
    if (product.stock_to_sales_ratio < 2) return 'danger';
    if (product.stock_to_sales_ratio < 4) return 'warning';
    return 'success';
  }

  getUrgencyIcon(product: RestockProduct): string {
    if (product.days_until_stockout < 7) return 'alert-circle';
    if (product.stock_to_sales_ratio < 2) return 'trending-down';
    if (product.stock_to_sales_ratio < 4) return 'trending-up';
    return 'checkmark-circle';
  }

  filteredProducts() {
    return this.products
      .filter(product => product.stock_to_sales_ratio < 4 || product.days_until_stockout < 30)
      .sort((a, b) => a.days_until_stockout - b.days_until_stockout);
  }

  getCriticalProducts() {
    return this.products.filter(p => p.days_until_stockout < 7).length;
  }

  getLowStockProducts() {
    return this.products.filter(p => p.stock_to_sales_ratio < 2 && p.days_until_stockout >= 7).length;
  }

  getRestockSoonProducts() {
    return this.products.filter(p => p.stock_to_sales_ratio >= 2 && p.stock_to_sales_ratio < 4).length;
  }

  async handleRefresh(event: any) {
    try {
      await this.loadRestockingRecommendations();
    } finally {
      event.target.complete();
    }
  }

  goBack() {
    this.router.navigate(['/wholesaler/home']);
  }
}