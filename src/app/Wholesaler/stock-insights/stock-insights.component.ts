import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule, NavController, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrentStockData, LeastStockedData, MandiBasicInfo, StockInsightsService } from './stock-insights.service';
import { finalize } from 'rxjs';
import { LowStockItemData, SlowMovingProductData } from './stock-insights.service';
import { addIcons } from 'ionicons';
import {
  warningOutline,
  timerOutline,
  businessOutline,
  locationOutline,
  cubeOutline,
  trendingDownOutline,
  chevronBackOutline
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

interface WarehouseData {
  products: string[];
  stock: number[];
}

interface StockData {
  [key: string]: WarehouseData;
}

@Component({
  selector: 'app-stock-insights',
  templateUrl: './stock-insights.component.html',
  styleUrls: ['./stock-insights.component.scss'],
  standalone: true,
  imports: [IonicModule, NgApexchartsModule, CommonModule, FormsModule, TranslatePipe],
})

export class StockInsightsComponent implements OnInit {
  selectedView: string = 'chart';
  selectedWarehouse: MandiBasicInfo | null = null;
  selectedProduct: number | null = null;
  productStockData: CurrentStockData[] = [];
  slowMovingProducts: SlowMovingProductData[] = [];
  warehouses: MandiBasicInfo[] = [];
  stockLevelsOptions: any = {
    series: [{ name: 'Current Stock', data: [] }],
    chart: {
      type: 'bar',
      height: 350,
      background: '#ffffff'
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '50%',
        distributed: true
      }
    },
    colors: ['#33b2df', '#546E7A', '#d4526e', '#13d8aa', '#A5978B', '#2b908f'],
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val.toLocaleString() + ' kg'
    },
    xaxis: { categories: [] },
    yaxis: { labels: { show: true } },
    tooltip: {
      y: {
        formatter: (val: number) => val.toLocaleString() + ' kg'
      }
    }
  };
  lowStockAlerts: LowStockItemData[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private navController: NavController,
    private stockInsightsService: StockInsightsService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertCtrl: AlertController,
    private router: Router,
    private authService: AuthService,
    private translate: TranslateService
  ) {
    addIcons({
      warningOutline,
      timerOutline,
      businessOutline,
      locationOutline,
      cubeOutline,
      trendingDownOutline,
      chevronBackOutline
    });
  }

  ngOnInit() {
    this.checkAuthAndLoadData();
  }

  // authentication check
  private checkAuthAndLoadData(): void {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    // Check if user has wholesaler role
    if (!this.authService.hasRole('wholesaler')) {
      this.showUnauthorizedError();
      return;
    }

    this.loadMandis();
  }

  private async showAuthError(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('STOCK_INSIGHTS.AUTH_ERROR'),
      message: this.translate.instant('STOCK_INSIGHTS.SESSION_EXPIRED'),
      backdropDismiss: false,
      buttons: [
        {
          text: this.translate.instant('STOCK_INSIGHTS.OK'),
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async showUnauthorizedError(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('STOCK_INSIGHTS.ACCESS_DENIED'),
      message: this.translate.instant('STOCK_INSIGHTS.NO_PERMISSION'),
      backdropDismiss: false,
      buttons: [
        {
          text: this.translate.instant('STOCK_INSIGHTS.OK'),
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger',
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  private async showLoading(message?: string): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingController.create({
      message: message || this.translate.instant('STOCK_INSIGHTS.LOADING_MESSAGE'),
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }

  private handleApiError(error: HttpErrorResponse, customMessage?: string): void {
    if (error.status === 401) {
      this.showAuthError();
      return;
    }

    let errorMessage: string;

    if (error.status === 0) {
      errorMessage = this.translate.instant('STOCK_INSIGHTS.NETWORK_ERROR');
    } else if (error.status >= 500) {
      errorMessage = this.translate.instant('STOCK_INSIGHTS.SERVER_ERROR');
    } else if (error.status === 403) {
      errorMessage = this.translate.instant('STOCK_INSIGHTS.FORBIDDEN_ERROR');
    } else if (error.status === 404) {
      errorMessage = this.translate.instant('STOCK_INSIGHTS.NOT_FOUND_ERROR');
    } else {
      errorMessage = customMessage || this.translate.instant('STOCK_INSIGHTS.UNEXPECTED_ERROR');
    }

    this.error = errorMessage;
    this.showErrorToast(errorMessage);
  }

  public async loadMandis(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    this.isLoading = true;
    this.error = null;

    const loading = await this.showLoading();

    this.stockInsightsService.getMandiList()
      .pipe(
        finalize(() => {
          loading.dismiss();
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (mandis) => {
          this.warehouses = mandis;
          if (mandis.length > 0) {
            this.selectedWarehouse = mandis[0];
            this.initializeData();
          } else {
            this.error = this.translate.instant('STOCK_INSIGHTS.NO_MANDIS');
          }
        },
        error: (error: HttpErrorResponse) => {
          this.handleApiError(error, this.translate.instant('STOCK_INSIGHTS.LOAD_MANDI_ERROR'));
        }
      });
  }

  private async initializeData(): Promise<void> {
    await Promise.all([
      this.updateChartData(),
      this.initializeAlerts(),
      this.initializeSlowMoving()
    ]);
  }

  private async initializeAlerts(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const loading = await this.showLoading();

    this.stockInsightsService.getLowStockItems()
      .pipe(
        finalize(() => loading.dismiss())
      )
      .subscribe({
        next: (data) => {
          this.lowStockAlerts = data;
        },
        error: (error: HttpErrorResponse) => {
          this.handleApiError(error, this.translate.instant('STOCK_INSIGHTS.LOAD_LOW_STOCK_ERROR'));
        }
      });
  }

  private async initializeSlowMoving(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const loading = await this.showLoading();

    this.stockInsightsService.getSlowMovingProducts()
      .pipe(
        finalize(() => loading.dismiss())
      )
      .subscribe({
        next: (data) => {
          this.slowMovingProducts = data;
        },
        error: (error: HttpErrorResponse) => {
          this.handleApiError(error, this.translate.instant('STOCK_INSIGHTS.LOAD_SLOW_MOVING_ERROR'));
        }
      });
  }

  async updateChartData(): Promise<void> {
    if (!this.selectedWarehouse || !this.authService.isAuthenticated()) {
      if (!this.authService.isAuthenticated()) {
        this.showAuthError();
      }
      return;
    }

    const loading = await this.showLoading();

    this.stockInsightsService.getCurrentStockByMandi(this.selectedWarehouse.mandi_id)
      .pipe(
        finalize(() => loading.dismiss())
      )
      .subscribe({
        next: (data) => {
          this.updateChartWithData(data);
        },
        error: (error: HttpErrorResponse) => {
          this.handleApiError(error, this.translate.instant('STOCK_INSIGHTS.LOAD_STOCK_ERROR'));
        }
      });
  }

  private updateChartWithData(data: CurrentStockData[]): void {
    this.stockLevelsOptions = {
      ...this.stockLevelsOptions,
      series: [{
        name: 'Current Stock',
        data: data.map(item => item.current_stock)
      }],
      xaxis: {
        categories: data.map(item => item.product_name)
      }
    };
  }

  async handleRefresh(event: any): Promise<void> {
    try {
      await this.initializeData();
    } catch {
      return;
    } finally {
      event.target.complete();
    }
  }

  onWarehouseChange(): void {
    if (this.selectedWarehouse) {
      this.updateChartData();
    }
  }

  goBack(): void {
    this.router.navigate(['/wholesaler/trends']);
  }

  // goToTrends(): void {
  //   this.navController.navigateBack('/wholesaler/trends');
  // }

  async getStockByProduct(productId: number): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const loading = await this.showLoading();

    this.stockInsightsService.getCurrentStockByProduct(productId)
      .pipe(
        finalize(() => loading.dismiss())
      )
      .subscribe({
        next: (data) => {
          this.productStockData = data;
          this.updateChartWithData(data);
        },
        error: (error: HttpErrorResponse) => {
          this.handleApiError(error, this.translate.instant('STOCK_INSIGHTS.ERROR_FETCHING_PRODUCT_STOCK'));
        }
      });
  }
}