import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule, NavController, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';
import { MarketComparisonService, BranchPriceData } from './market-comparison.service';
import { WholesalerApiService } from '../services/wholesaler-api.service';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BranchData } from '../stock-insights/stock-insights.service';
import { StockInsightsService } from '../stock-insights/stock-insights.service';

interface Product {
  product_id: number;
  product_name: string;
}

@Component({
  selector: 'app-market-comparison',
  templateUrl: './market-comparison.component.html',
  styleUrls: ['./market-comparison.component.scss'],
  standalone: true,
  imports: [IonicModule, NgApexchartsModule, FormsModule, CommonModule, TranslatePipe]
})
export class MarketComparisonComponent implements OnInit {
  priceComparisonOptions: any;
  availableBranches: BranchData[] = [];
  availableProducts: Product[] = [];
  selectedBranches: number[] = [];
  selectedProducts: number[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private navController: NavController,
    private marketComparisonService: MarketComparisonService,
    private wholesalerApiService: WholesalerApiService,
    private stockInsightsService: StockInsightsService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertCtrl: AlertController,
    private router: Router,
    private authService: AuthService,
    private translate: TranslateService
  ) {
    addIcons({ chevronBackOutline });
  }

  ngOnInit() {
    this.checkAuthAndInitialize();
  }

  private checkAuthAndInitialize() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    if (!this.authService.hasRole('wholesaler')) {
      this.showUnauthorizedError();
      return;
    }

    this.setupChartOptions();
    this.loadBranchesAndProducts();
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('MARKET_COMPARISON.AUTH_ERROR'),
      message: this.translate.instant('MARKET_COMPARISON.SESSION_EXPIRED'),
      buttons: [
        {
          text: this.translate.instant('MARKET_COMPARISON.OK'),
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
      header: this.translate.instant('MARKET_COMPARISON.ACCESS_DENIED'),
      message: this.translate.instant('MARKET_COMPARISON.NO_PERMISSION'),
      buttons: [
        {
          text: this.translate.instant('MARKET_COMPARISON.OK'),
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  async showLoading() {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: this.translate.instant('MARKET_COMPARISON.LOADING'),
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }

  private async showToast(message: string, color: string = 'warning') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: color,
      buttons: [{ icon: 'close', role: 'cancel' }]
    });
    await toast.present();
  }

  async loadBranchesAndProducts() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const loading = await this.showLoading();
    this.error = null;

    try {
      forkJoin({
        branches: this.stockInsightsService.getAllBusinessBranches().pipe(
          catchError(err => {
            console.error('Failed to load branches:', err);
            if (err.status === 401) {
              this.showAuthError();
            }
            return of([]);
          })
        ),
        products: this.wholesalerApiService.getWholesalerProducts().pipe(
          map(products => products.map(p => ({
            product_id: p.product_id,
            product_name: p.product_name
          }))),
          catchError(err => {
            console.error('Failed to load products:', err);
            if (err.status === 401) {
              this.showAuthError();
            }
            return of([]);
          })
        )
      })
      .pipe(
        finalize(() => {
          loading.dismiss();
          this.isLoading = false;
        })
      )
      .subscribe({
        next: ({ branches, products }) => {
          // Filter active branches
          this.availableBranches = branches.filter(b => b.active_status);
          this.availableProducts = products;

          if (this.availableBranches.length === 0) {
            this.error = this.translate.instant('MARKET_COMPARISON.NO_BRANCHES');
            this.showToast(this.translate.instant('MARKET_COMPARISON.NO_BRANCHES'), 'warning');
            return;
          }

          if (this.availableProducts.length === 0) {
            this.error = this.translate.instant('MARKET_COMPARISON.NO_PRODUCTS');
            this.showToast(this.translate.instant('MARKET_COMPARISON.NO_PRODUCTS'), 'warning');
            return;
          }

          // Auto-select first 3 branches (or all if less than 3)
          this.selectedBranches = this.availableBranches
            .slice(0, Math.min(3, this.availableBranches.length))
            .map(b => b.branch_id);

          // Auto-select first 3 products (or all if less than 3)
          this.selectedProducts = this.availableProducts
            .slice(0, Math.min(3, this.availableProducts.length))
            .map(p => p.product_id);

          // Load initial chart data
          if (this.selectedBranches.length > 0 && this.selectedProducts.length > 0) {
            this.updateChart();
          }
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.error = this.translate.instant('MARKET_COMPARISON.LOAD_ERROR');
          this.showToast(this.translate.instant('MARKET_COMPARISON.LOAD_ERROR'), 'danger');
        }
      });
    } catch (error) {
      loading.dismiss();
      this.isLoading = false;
      this.error = this.translate.instant('MARKET_COMPARISON.UNEXPECTED_ERROR');
      this.showToast(this.translate.instant('MARKET_COMPARISON.UNEXPECTED_ERROR'), 'danger');
    }
  }

  onBranchChange(event: any) {
    if (this.selectedBranches.length > 0 && this.selectedProducts.length > 0) {
      this.updateChart();
    } else if (this.selectedBranches.length === 0) {
      this.showToast(this.translate.instant('MARKET_COMPARISON.SELECT_BRANCHES_WARNING'), 'warning');
    }
  }

  onProductChange(event: any) {
    if (this.selectedBranches.length > 0 && this.selectedProducts.length > 0) {
      this.updateChart();
    } else if (this.selectedProducts.length === 0) {
      this.showToast(this.translate.instant('MARKET_COMPARISON.SELECT_PRODUCTS_WARNING'), 'warning');
    }
  }

  async updateChart() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    if (this.selectedBranches.length === 0 || this.selectedProducts.length === 0) {
      this.showToast(this.translate.instant('MARKET_COMPARISON.SELECT_BOTH'), 'warning');
      return;
    }

    const loading = await this.showLoading();

    try {
      this.marketComparisonService.getBranchPriceComparison(
        this.selectedBranches,
        this.selectedProducts
      )
      .pipe(
        catchError(error => {
          console.error('API Error:', error);

          if (error.status === 401) {
            this.showAuthError();
            return of([]);
          }

          this.showToast(this.translate.instant('MARKET_COMPARISON.UNABLE_TO_FETCH'), 'danger');
          return of([]);
        }),
        finalize(() => {
          loading.dismiss();
          this.isLoading = false;
        })
      )
      .subscribe(data => {
        if (data && data.length > 0) {
          this.updateChartWithRealData(data);
          this.showToast(this.translate.instant('MARKET_COMPARISON.DATA_UPDATED'), 'success');
        } else {
          this.showToast(this.translate.instant('MARKET_COMPARISON.NO_DATA'), 'warning');
          this.clearChart();
        }
      });
    } catch (error) {
      loading.dismiss();
      this.isLoading = false;
      this.showToast(this.translate.instant('MARKET_COMPARISON.ERROR_FETCHING'), 'danger');
    }
  }

  private updateChartWithRealData(data: BranchPriceData[]) {
    // Create a map for branches with their data
    const branchMap = new Map<number, { name: string; data: number[] }>();
    
    // Initialize branch data structure
    this.selectedBranches.forEach(branchId => {
      const branch = this.availableBranches.find(b => b.branch_id === branchId);
      if (branch) {
        branchMap.set(branchId, {
          name: branch.shop_name,
          data: []
        });
      }
    });

    // Fill in prices for each product across all selected branches
    this.selectedProducts.forEach(productId => {
      this.selectedBranches.forEach(branchId => {
        const priceData = data.find(
          d => d.branch_id === branchId && d.product_id === productId
        );
        
        const branchData = branchMap.get(branchId);
        if (branchData) {
          // Use 0 if no price data available
          branchData.data.push(priceData ? priceData.price_per_unit : 0);
        }
      });
    });

    // Convert map to series array
    const seriesData = Array.from(branchMap.values());
    
    // Get product names for x-axis
    const productNames = this.selectedProducts.map(id => {
      const product = this.availableProducts.find(p => p.product_id === id);
      return product ? product.product_name : `Product ${id}`;
    });

    this.updateChartOptions(seriesData, productNames);
  }

  private updateChartOptions(seriesData: any[], categories: string[]) {
    this.priceComparisonOptions = {
      ...this.priceComparisonOptions,
      series: seriesData,
      xaxis: {
        ...this.priceComparisonOptions.xaxis,
        categories: categories
      }
    };
  }

  private clearChart() {
    this.priceComparisonOptions = {
      ...this.priceComparisonOptions,
      series: [],
      xaxis: {
        ...this.priceComparisonOptions.xaxis,
        categories: []
      }
    };
  }

  private setupChartOptions() {
    this.priceComparisonOptions = {
      series: [],
      chart: {
        type: 'bar',
        height: 400,
        stacked: false,
        toolbar: { 
          show: true,
          tools: {
            download: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          borderRadius: 6,
          dataLabels: {
            position: 'top'
          }
        }
      },
      colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#546E7A', '#26a69a'],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => val > 0 ? `₹${val.toFixed(0)}` : '',
        offsetY: -20,
        style: {
          fontSize: '10px',
          colors: ['#304758']
        }
      },
      xaxis: {
        categories: [],
        title: { 
          text: this.translate.instant('MARKET_COMPARISON.PRODUCTS_LABEL'),
          style: {
            fontSize: '14px',
            fontWeight: 600
          }
        },
        labels: {
          style: {
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        title: { 
          text: this.translate.instant('MARKET_COMPARISON.PRICE_LABEL'),
          style: {
            fontSize: '14px',
            fontWeight: 600
          }
        },
        labels: {
          formatter: (val: number) => `₹${val.toFixed(0)}`,
          style: {
            fontSize: '12px'
          }
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (val: number) => val > 0 ? `₹${val.toFixed(2)}/kg` : 'N/A'
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        fontSize: '13px',
        fontWeight: 500,
        offsetY: 0,
        markers: {
          width: 10,
          height: 10,
          radius: 2
        }
      },
      grid: {
        borderColor: '#e7e7e7',
        strokeDashArray: 4
      }
    };
  }

  async handleRefresh(event: any) {
    try {
      if (!this.authService.isAuthenticated()) {
        this.showAuthError();
        return;
      }

      await this.loadBranchesAndProducts();
    } finally {
      event.target.complete();
    }
  }

  goBack() {
    this.router.navigate(['/wholesaler/home']);
  }

  goToTrends() {
    this.navController.navigateBack('/wholesaler/trends');
  }

  getBranchName(branchId: number): string {
    const branch = this.availableBranches.find(b => b.branch_id === branchId);
    return branch ? branch.shop_name : `Branch ${branchId}`;
  }

  getProductName(productId: number): string {
    const product = this.availableProducts.find(p => p.product_id === productId);
    return product ? product.product_name : `Product ${productId}`;
  }
}