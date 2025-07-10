import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule, NavController, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrentStockData, LeastStockedData, MandiBasicInfo, StockInsightsService } from './stock-insights.service';
import { catchError, finalize, of } from 'rxjs';
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
  imports: [IonicModule, NgApexchartsModule, CommonModule, FormsModule],
})

export class StockInsightsComponent implements OnInit {
  selectedView: string = 'chart';
  selectedWarehouse: MandiBasicInfo | null = null;
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
    private authService: AuthService
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

    this.loadMandis();
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: 'Authentication Error',
      message: 'Your session has expired. Please login again.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  // unauthorized error handler
  private async showUnauthorizedError() {
    const alert = await this.alertCtrl.create({
      header: 'Access Denied',
      message: 'You do not have permission to access this page.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async loadMandis() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    this.isLoading = true;
    this.error = null;

    const loading = await this.showLoading();

    try {
      this.stockInsightsService.getMandiList().subscribe({
        next: (mandis) => {
          this.warehouses = mandis;
          if (mandis.length > 0) {
            this.selectedWarehouse = mandis[0];
            this.initializeData();
          } else {
            this.error = 'No mandis available for your account';
          }
        },
        error: async (error) => {
          console.error('Failed to load mandis:', error);

          if (error.status === 401) {
            await this.showAuthError();
            return;
          }

          this.error = 'Failed to load mandi list. Please try again.';
          this.showErrorToast(this.error);
        },
        complete: () => {
          loading.dismiss();
          this.isLoading = false;
        }
      });
    } catch (error) {
      loading.dismiss();
      this.isLoading = false;
      this.error = 'An unexpected error occurred';
      this.showErrorToast(this.error);
    }
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
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

  async showLoading() {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Loading data...',
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }

  goToTrends() {
    this.navController.navigateBack('/wholesaler/trends');
  }

  private async initializeData() {
    await this.initializeCharts();
    await this.initializeAlerts();
    await this.initializeSlowMoving();
  }

  private async initializeCharts() {
    await this.updateChartData();
  }

  private async initializeAlerts() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const loading = await this.showLoading();
    try {
      this.stockInsightsService.getLowStockItems()
        .pipe(
          finalize(() => {
            loading.dismiss();
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (data) => {
            this.lowStockAlerts = data;
          },
          error: async (error) => {
            console.error('Failed to fetch low stock items:', error);

            if (error.status === 401) {
              await this.showAuthError();
              return;
            }

            this.showErrorToast('Failed to fetch low stock alerts');
          }
        });
    } catch (error) {
      loading.dismiss();
      this.showErrorToast('An error occurred while fetching alerts');
    }
  }

  private async initializeSlowMoving() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const loading = await this.showLoading();
    try {
      this.stockInsightsService.getSlowMovingProducts()
        .pipe(
          finalize(() => {
            loading.dismiss();
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (data) => {
            this.slowMovingProducts = data;
          },
          error: async (error) => {
            console.error('Failed to fetch slow moving products:', error);

            if (error.status === 401) {
              await this.showAuthError();
              return;
            }

            this.showErrorToast('Failed to fetch slow moving products');
          }
        });
    } catch (error) {
      loading.dismiss();
      this.showErrorToast('An error occurred while fetching slow moving products');
    }
  }

  async updateChartData() {
    if (!this.selectedWarehouse || !this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const loading = await this.showLoading();
    try {
      this.stockInsightsService.getCurrentStockByMandi(this.selectedWarehouse.mandi_id)
        .pipe(
          finalize(() => {
            loading.dismiss();
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (data) => {
            this.updateChartWithData(data);
          },
          error: async (error) => {
            console.error('Failed to fetch stock data:', error);

            if (error.status === 401) {
              await this.showAuthError();
              return;
            }

            this.showErrorToast('Failed to fetch stock data');
          }
        });
    } catch (error) {
      loading.dismiss();
      this.showErrorToast('An error occurred while fetching stock data');
    }
  }

  private updateChartWithData(data: CurrentStockData[]) {
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

  async handleRefresh(event: any) {
    try {
      await this.initializeData();
    } finally {
      event.target.complete();
    }
  }

  onWarehouseChange() {
    if (this.selectedWarehouse) {
      this.updateChartData();
    }
  }

  goBack() {
    this.router.navigate(['/wholesaler/home']);
  }
}