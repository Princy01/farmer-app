import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule, NavController, LoadingController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';
import { SalesTrendsService, SalesTrend, TopSellingProduct } from './sales-trends.service';
import { catchError, finalize, of } from 'rxjs';
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
export class SalesTrendsComponent implements OnInit {
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
    private router: Router,
    private authService: AuthService,
    private translate: TranslateService
  ) {
    addIcons({ chevronBackOutline });
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

    this.selectedView = 'trends';
    this.selectedPeriod = 'monthly';
    this.selectedMetric = 'volume';

    setTimeout(() => {
      this.initializeCharts();
    }, 0);
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

  async showLoading() {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: this.translate.instant('SALES_TRENDS.LOADING'),
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
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
        catchError(error => {
          console.error('API Error:', error);
          this.errorMessage = this.translate.instant('SALES_TRENDS.ERROR_LOADING_DATA');
          if (error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
          return of([]);
        }),
        finalize(() => {
          loading.dismiss();
          this.isLoading = false;
        })
      ).subscribe({
        next: (data) => {
          console.log('Fetched data:', data);
          if (data && Array.isArray(data)) {
            this.updateTrendsChartOptions(data);
          }
        },
        error: (error) => {
          console.error('Error updating trends chart:', error);
        }
      });
    } catch (error) {
      loading.dismiss();
      this.isLoading = false;
      console.error('Error in updateTrendsChart:', error);
    }
  }

  private updateTrendsChartOptions(data: any[]) {
    // Ensure data has the correct fields from backend
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
            formatter: (value: number) => `₹${(value / 1000).toFixed(0)}K`
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
        catchError(error => {
          console.error('API Error:', error);
          this.errorMessage = this.translate.instant('SALES_TRENDS.ERROR_LOADING_DATA');
          if (error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
          return of([]);
        }),
        finalize(() => {
          loading.dismiss();
          this.isLoading = false;
        })
      ).subscribe(products => {
        console.log('Top Products:', products);
        if (products && Array.isArray(products)) {
          this.updateTopProductsChartOptions(products);
        }
      });
    } catch (error) {
      loading.dismiss();
      this.isLoading = false;
      console.error('Error in updateTopProductsChart:', error);
    }
  }

  private updateTopProductsChartOptions(products: TopSellingProduct[]) {
    const isVolume = this.selectedMetric === 'volume';
    console.log('Top Products:', products);

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
          formatter: (value: number) => isVolume ? `${value} kg` : `₹${(value / 1000).toFixed(0)}K`
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