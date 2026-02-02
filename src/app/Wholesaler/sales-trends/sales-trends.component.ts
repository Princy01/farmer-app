import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule, NavController, LoadingController, AlertController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';
import { SalesTrendsService, SalesTrend, TopSellingProduct } from './sales-trends.service';
import { catchError, finalize, of, Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

interface ProductData {
  name: string;
  volume: number;
  price: number;
}

@Component({
  selector: 'app-sales-trends',
  templateUrl: './sales-trends.component.html',
  styleUrls: ['./sales-trends.component.scss'],
  standalone: true,
  imports: [IonicModule, NgApexchartsModule, FormsModule, CommonModule, TranslatePipe],
})
export class SalesTrendsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private currentLoading: HTMLIonLoadingElement | null = null;
  selectedView: string = 'trends';
  selectedPeriod: string = 'monthly';
  selectedMetric: string = 'volume';
  chartOptions: any;
  topProductsOptions: any;

  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private navController: NavController,
    private salesTrendsService: SalesTrendsService,
    private loadingController: LoadingController,
    private alertCtrl: AlertController,
    private toastController: ToastController,
    private router: Router,
    private authService: AuthService,
    private translate: TranslateService
  ) {
    addIcons({ chevronBackOutline });
  }

  ngOnInit() {
    this.checkAuthAndLoadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.currentLoading) {
      this.currentLoading.dismiss();
    }
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

    this.initializeCharts();
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('SALES_TRENDS.AUTH_ERROR'),
      message: this.translate.instant('SALES_TRENDS.SESSION_EXPIRED'),
      buttons: [
        {
          text: this.translate.instant('SALES_TRENDS.OK'),
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
      header: this.translate.instant('SALES_TRENDS.ACCESS_DENIED'),
      message: this.translate.instant('SALES_TRENDS.NO_PERMISSION'),
      buttons: [
        {
          text: this.translate.instant('SALES_TRENDS.OK'),
          handler: () => {
            this.navController.navigateBack('/wholesaler');
          }
        }
      ]
    });
    await alert.present();
  }

  private async showLoading(): Promise<HTMLIonLoadingElement> {
    // Dismiss any existing loader first
    if (this.currentLoading) {
      await this.currentLoading.dismiss();
    }

    this.isLoading = true;
    this.currentLoading = await this.loadingController.create({
      message: this.translate.instant('SALES_TRENDS.LOADING'),
      spinner: 'crescent'
    });
    await this.currentLoading.present();
    return this.currentLoading;
  }

  private async hideLoading() {
    this.isLoading = false;
    console.log(this.currentLoading)
    if (this.currentLoading) {
      console.log('Dismissing loader'); 
      await this.currentLoading.dismiss();
      console.log('Loader dismissed');
      this.currentLoading = null;
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
          text: this.translate.instant('SALES_TRENDS.DISMISS'),
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  goToTrends() {
    this.navController.navigateBack('/wholesaler/trends');
  }

  onViewChange() {
    this.initializeCharts();
  }

  onPeriodChange() {
    this.initializeCharts();
  }

  onMetricChange() {
    this.initializeCharts();
  }

  private initializeCharts() {
    this.updateTrendsChart();
    this.updateTopProductsChart();
  }

  private async updateTrendsChart() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const loading = await this.showLoading();
    try {
      let dataObservable;
      switch (this.selectedPeriod) {
        case 'weekly':
          dataObservable = this.salesTrendsService.getWeeklySales();
          break;
        case 'monthly':
          dataObservable = this.salesTrendsService.getMonthlySales();
          break;
        case 'yearly':
          dataObservable = this.salesTrendsService.getYearlySales();
          break;
        default:
          dataObservable = this.salesTrendsService.getMonthlySales();
      }

      dataObservable.pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('API Error:', error);
          const errorMsg = this.translate.instant('SALES_TRENDS.ERROR_LOADING_DATA');
          this.errorMessage = errorMsg;
          this.showErrorToast(errorMsg);

          if (error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
          return of([]);
        }),
        finalize(() => {
          this.hideLoading();
        })
      ).subscribe({
        next: (data) => {
          if (data && Array.isArray(data) && data.length > 0) {
            this.updateTrendsChartOptions(data);
            this.errorMessage = '';
          } else {
            this.chartOptions = null;
            this.errorMessage = this.translate.instant('SALES_TRENDS.NO_DATA_AVAILABLE');
          }
        },
        error: (error) => {
          console.error('Error updating trends chart:', error);
        }
      });
    } catch (error) {
      await this.hideLoading();
      console.error('Error in updateTrendsChart:', error);
      this.showErrorToast(this.translate.instant('SALES_TRENDS.UNEXPECTED_ERROR'));
    }
  }

  private updateTrendsChartOptions(data: SalesTrend[]) {
    if (!data || data.length === 0) {
      this.chartOptions = null;
      return;
    }

    this.chartOptions = {
      series: [
        {
          name: this.translate.instant('SALES_TRENDS.TOTAL_REVENUE'),
          data: data.map(item => item.total_revenue || 0)
        },
        {
          name: this.translate.instant('SALES_TRENDS.TOTAL_ORDERS'),
          data: data.map(item => item.total_orders || 0)
        }
      ],
      chart: {
        height: 350,
        type: 'line',
        background: '#ffffff',
        toolbar: {
          show: true
        }
      },
      colors: ['#2E93fA', '#66DA26'],
      xaxis: {
        categories: data.map(item => item.month_year || 'N/A')
      },
      yaxis: [
        {
          title: {
            text: this.translate.instant('SALES_TRENDS.REVENUE_LABEL')
          },
          labels: {
            formatter: (value: number) => `₹${(value / 1000).toFixed(2)}K`
          }
        },
        {
          opposite: true,
          title: {
            text: this.translate.instant('SALES_TRENDS.ORDERS_LABEL')
          },
          labels: {
            formatter: (value: number) => `${Math.round(value)}`
          }
        }
      ],
      title: {
        text: this.translate.instant('SALES_TRENDS.SALES_TRENDS_TITLE', {
          period: this.translate.instant(`SALES_TRENDS.PERIOD_${this.selectedPeriod.toUpperCase()}`)
        }),
        align: 'center',
        style: {
          fontSize: '16px'
        },
        margin: 40
      }
    };
  }

  private async updateTopProductsChart() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const loading = await this.showLoading();
    try {
      let dataObservable;
      switch (this.selectedPeriod) {
        case 'weekly':
          dataObservable = this.salesTrendsService.getTopSellingWeekly();
          break;
        case 'monthly':
          dataObservable = this.salesTrendsService.getTopSellingMonthly();
          break;
        case 'yearly':
          dataObservable = this.salesTrendsService.getTopSellingYearly();
          break;
        default:
          dataObservable = this.salesTrendsService.getTopSellingMonthly();
      }

      dataObservable.pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('API Error:', error);
          const errorMsg = this.translate.instant('SALES_TRENDS.ERROR_LOADING_DATA');
          this.errorMessage = errorMsg;
          this.showErrorToast(errorMsg);

          if (error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
          return of([]);
        }),
        finalize(() => {
          this.hideLoading();
        })
      ).subscribe({
        next: (products) => {
          if (products && Array.isArray(products) && products.length > 0) {
            this.updateTopProductsChartOptions(products);
            this.errorMessage = '';
          } else {
            this.topProductsOptions = null;
            this.errorMessage = this.translate.instant('SALES_TRENDS.NO_DATA_AVAILABLE');
          }
        },
        error: (error) => {
          console.error('Error updating top products chart:', error);
        }
      });
    } catch (error) {
      await this.hideLoading();
      console.error('Error in updateTopProductsChart:', error);
      this.showErrorToast(this.translate.instant('SALES_TRENDS.UNEXPECTED_ERROR'));
    }
  }

  private updateTopProductsChartOptions(products: TopSellingProduct[]) {
    if (!products || products.length === 0) {
      this.topProductsOptions = null;
      return;
    }

    const isVolume = this.selectedMetric === 'volume';

    const sortedData = [...products].sort((a, b) =>
      isVolume ?
        (b.total_quantity_kg || 0) - (a.total_quantity_kg || 0) :
        (b.total_price || 0) - (a.total_price || 0)
    );

    const top10Products = sortedData.slice(0, 10);

    // Set up bar chart options for top products
    this.topProductsOptions = {
      series: [
        {
          name: isVolume ? this.translate.instant('SALES_TRENDS.VOLUME_KG') : this.translate.instant('SALES_TRENDS.REVENUE_INR'),
          data: top10Products.map(p => isVolume ? (p.total_quantity_kg || 0) : (p.total_price || 0))
        }
      ],
      chart: {
        type: 'bar',
        height: 350,
        background: '#ffffff',
        toolbar: {
          show: true
        }
      },
      colors: ['#546E7A'],
      xaxis: {
        categories: top10Products.map(p => p.product_name || this.translate.instant('SALES_TRENDS.UNKNOWN_PRODUCT')),
        title: {
          text: this.translate.instant('SALES_TRENDS.PRODUCTS')
        }
      },
      yaxis: {
        title: {
          text: isVolume ? this.translate.instant('SALES_TRENDS.VOLUME_LABEL') : this.translate.instant('SALES_TRENDS.REVENUE_LABEL')
        },
        labels: {
          formatter: (value: number) => isVolume ? `${value} kg` : `₹${(value / 1000).toFixed(2)}K`
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded'
        }
      },
      dataLabels: {
        enabled: false
      },
      title: {
        text: this.translate.instant('SALES_TRENDS.TOP_PRODUCTS_TITLE', {
          period: this.translate.instant(`SALES_TRENDS.PERIOD_${this.selectedPeriod.toUpperCase()}`),
          metric: this.translate.instant(`SALES_TRENDS.METRIC_${this.selectedMetric.toUpperCase()}`)
        }),
        align: 'center',
        style: {
          fontSize: '16px'
        },
        margin: 40
      },
      grid: {
        show: true
      },
      tooltip: {
        y: {
          formatter: (value: number) => isVolume ? `${value} kg` : `₹${value.toFixed(2)}`
        }
      }
    };
  }
}