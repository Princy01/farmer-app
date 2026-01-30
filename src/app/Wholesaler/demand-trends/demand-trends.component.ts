import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { DemandTrendsService, DemandPatternRow, ProductDemandComparisonRow } from './demand-trends.service';

interface ProductData {
  name: string;
  isSelected: boolean;
  data: number[];
}

@Component({
  selector: 'app-demand-trends',
  standalone: true,
  imports: [IonicModule, NgApexchartsModule, FormsModule, CommonModule, TranslateModule],
  templateUrl: './demand-trends.component.html',
  styleUrls: ['./demand-trends.component.scss']
})
export class DemandTrendsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  selectedTimeRange = 'monthly';
  searchTerm = '';
  allSelected = false;
  products: ProductData[] = [];
  filteredProducts: ProductData[] = [];
  seasonalDemandOptions: any;
  productDemandOptions: any;
  comparisonData: ProductDemandComparisonRow[] = [];
  selectedProducts: string[] = [];

  isLoading = false;
  hasError = false;
  errorMessage = '';

  customActionSheetOptions = {
    header: '',
    subHeader: ''
  };

  constructor(
    private navController: NavController,
    private demandService: DemandTrendsService,
    private toastController: ToastController,
    private translate: TranslateService
  ) {
    addIcons({ chevronBackOutline });
  }

  ngOnInit() {
    this.initializeTranslations();
    this.loadProducts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTranslations() {
    this.translate.get([
      'DEMAND_TRENDS.SELECT_PRODUCTS',
      'DEMAND_TRENDS.CHOOSE_PRODUCTS_SUBTITLE'
    ]).pipe(takeUntil(this.destroy$)).subscribe(translations => {
      this.customActionSheetOptions = {
        header: translations['DEMAND_TRENDS.SELECT_PRODUCTS'],
        subHeader: translations['DEMAND_TRENDS.CHOOSE_PRODUCTS_SUBTITLE']
      };
    });
  }

  goToTrends() {
    this.navController.navigateBack('/wholesaler/trends');
  }

  onProductSelectionChange() {
    if (!this.products || this.products.length === 0) return;

    this.products.forEach(p => {
      p.isSelected = this.selectedProducts.includes(p.name);
    });
    this.updateCharts();
  }

  filterProducts() {
    if (!this.products || this.products.length === 0) {
      this.filteredProducts = [];
      return;
    }

    if (!this.searchTerm?.trim()) {
      this.filteredProducts = [...this.products];
      return;
    }

    const search = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(product =>
      product.name?.toLowerCase().includes(search)
    );
  }

  toggleAllProducts() {
    this.allSelected = !this.allSelected;
    if (this.allSelected) {
      this.selectedProducts = this.products.map(p => p.name);
    } else {
      this.selectedProducts = [];
    }
    this.onProductSelectionChange();
  }

  private syncProductSelections() {
    if (!this.products || this.products.length === 0) return;

    this.products.forEach(p => {
      p.isSelected = this.selectedProducts.includes(p.name);
    });
    this.allSelected = this.selectedProducts.length === this.products.length;
  }

  private loadProducts() {
    this.isLoading = true;
    this.hasError = false;

    this.demandService.getDemandPatterns(this.selectedTimeRange)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          if (!data || data.length === 0) {
            this.showToast('DEMAND_TRENDS.NO_DATA_AVAILABLE', 'warning');
            this.products = [];
            this.filteredProducts = [];
            return;
          }

          const productMap = new Map<string, ProductData>();
          data.forEach(row => {
            if (row.product_name && !productMap.has(row.product_name)) {
              productMap.set(row.product_name, {
                name: row.product_name,
                isSelected: false,
                data: []
              });
            }
          });

          this.products = Array.from(productMap.values());
          this.filteredProducts = [...this.products];
          this.selectedProducts = this.products.slice(0, Math.min(2, this.products.length)).map(p => p.name);
          this.syncProductSelections();
          this.loadInitialData();
        },
        error: (error) => {
          this.handleError(error, 'DEMAND_TRENDS.ERROR_LOADING_PRODUCTS');
        }
      });
  }

  private loadInitialData() {
    this.isLoading = true;

    forkJoin({
      patterns: this.demandService.getDemandPatterns(this.selectedTimeRange),
      comparison: this.demandService.getProductDemandComparison(this.selectedTimeRange)
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: ({ patterns, comparison }) => {
          this.processPatternData(patterns);
          this.comparisonData = comparison || [];
          this.updateCharts();
        },
        error: (error) => {
          this.handleError(error, 'DEMAND_TRENDS.ERROR_LOADING_DATA');
        }
      });
  }

  private processPatternData(patterns: DemandPatternRow[]) {
    if (!patterns || patterns.length === 0) return;

    const productDataMap = new Map<string, Map<string, number>>();
    patterns.forEach(row => {
      if (!row.product_name) return;

      if (!productDataMap.has(row.product_name)) {
        productDataMap.set(row.product_name, new Map());
      }
      const periodKey = this.getPeriodKey(row.period, this.selectedTimeRange);
      productDataMap.get(row.product_name)!.set(periodKey, row.total_quantity || 0);
    });

    const allPeriods = Array.from(
      new Set(patterns.map(p => this.getPeriodKey(p.period, this.selectedTimeRange)))
    ).sort();

    this.products.forEach(product => {
      product.data = allPeriods.map(period =>
        productDataMap.get(product.name)?.get(period) || 0
      );
    });
  }

  updateCharts() {
    if (!this.products || this.products.length === 0) return;

    const periods = this.getPeriodsCount(this.selectedTimeRange);
    const selectedProducts = this.products.filter(p => p.isSelected);

    if (selectedProducts.length === 0) {
      this.showToast('DEMAND_TRENDS.SELECT_AT_LEAST_ONE_PRODUCT', 'warning');
      return;
    }

    this.updateSeasonalDemandChart(selectedProducts, periods);
    this.updateProductDemandChart(selectedProducts);
  }

  private updateSeasonalDemandChart(selectedProducts: ProductData[], periods: number) {
    this.translate.get([
      'DEMAND_TRENDS.DEMAND_KG'
    ]).pipe(takeUntil(this.destroy$)).subscribe(translations => {
      this.seasonalDemandOptions = {
        series: selectedProducts.map(product => ({
          name: product.name,
          data: product.data.slice(-periods)
        })),
        chart: {
          height: 350,
          type: 'line',
          background: '#ffffff',
          toolbar: { show: false }
        },
        colors: ['#FF6B6B', '#45B7D1', '#4ECDC4', '#96CEB4', '#FFEEAD', '#D4A5A5'],
        xaxis: {
          categories: this.getLastXPeriods(periods, this.selectedTimeRange)
        },
        yaxis: {
          title: { text: translations['DEMAND_TRENDS.DEMAND_KG'] },
          labels: {
            formatter: (val: number) => this.formatKg(val)
          }
        },
        tooltip: {
          y: {
            formatter: (val: number) => this.formatKg(val)
          }
        }
      };
    });
  }

  private updateProductDemandChart(selectedProducts: ProductData[]) {
    this.translate.get([
      'DEMAND_TRENDS.CURRENT_PERIOD',
      'DEMAND_TRENDS.PREVIOUS_PERIOD',
      'DEMAND_TRENDS.DEMAND_KG'
    ]).pipe(takeUntil(this.destroy$)).subscribe(translations => {
      const currentData = selectedProducts.map(p => {
        const comp = this.comparisonData.find(c => c.product_name === p.name);
        return comp ? comp.total_quantity : 0;
      });

      const previousData = selectedProducts.map(p =>
        p.data[p.data.length - 2] || 0
      );

      this.productDemandOptions = {
        series: [
          {
            name: translations['DEMAND_TRENDS.CURRENT_PERIOD'],
            data: currentData
          },
          {
            name: translations['DEMAND_TRENDS.PREVIOUS_PERIOD'],
            data: previousData
          }
        ],
        chart: {
          type: 'bar',
          height: 350,
          background: '#ffffff',
          toolbar: { show: false }
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            borderRadius: 5
          }
        },
        colors: ['#2E7D32', '#1976D2'],
        xaxis: {
          categories: selectedProducts.map(p => p.name)
        },
        yaxis: {
          title: { text: translations['DEMAND_TRENDS.DEMAND_KG'] },
          labels: {
            formatter: (val: number) => this.formatKg(val)
          }
        },
        tooltip: {
          y: {
            formatter: (val: number) => this.formatKg(val)
          }
        }
      };
    });
  }

  private formatKg(val: number): string {
    return `${(val || 0).toLocaleString()} kg`;
  }

  private getPeriodKey(period: string, range: string): string {
    if (!period) return '';

    const date = new Date(period);
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    switch (range) {
      case 'weekly':
        const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
        return `${year}-W${week.toString().padStart(2, '0')}`;
      case 'monthly':
        return `${year}-${month.toString().padStart(2, '0')}`;
      case 'quarterly':
        const quarter = Math.ceil(month / 3);
        return `${year}-Q${quarter}`;
      case 'yearly':
        return `${year}`;
      default:
        return `${year}-${month.toString().padStart(2, '0')}`;
    }
  }

  private getPeriodsCount(range: string): number {
    switch (range) {
      case 'weekly': return 12;
      case 'monthly': return 12;
      case 'quarterly': return 4;
      case 'yearly': return 5;
      default: return 12;
    }
  }

  private getLastXPeriods(count: number, range: string): string[] {
    const result: string[] = [];
    const now = new Date();

    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now);
      switch (range) {
        case 'weekly':
          date.setDate(date.getDate() - i * 7);
          const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
          result.push(`${date.getFullYear()}-W${week.toString().padStart(2, '0')}`);
          break;
        case 'monthly':
          date.setMonth(date.getMonth() - i);
          result.push(`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`);
          break;
        case 'quarterly':
          date.setMonth(date.getMonth() - i * 3);
          const quarter = Math.ceil((date.getMonth() + 1) / 3);
          result.push(`${date.getFullYear()}-Q${quarter}`);
          break;
        case 'yearly':
          date.setFullYear(date.getFullYear() - i);
          result.push(`${date.getFullYear()}`);
          break;
        default:
          date.setMonth(date.getMonth() - i);
          result.push(`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`);
      }
    }
    return result;
  }

  onTimeRangeChange(newRange: string) {
    if (!newRange) return;

    this.selectedTimeRange = newRange;
    this.products = [];
    this.filteredProducts = [];
    this.comparisonData = [];
    this.selectedProducts = [];
    this.loadProducts();
  }

  private handleError(error: any, messageKey: string) {
    this.hasError = true;
    console.error('Demand Trends Component Error:', error);
    this.showToast(messageKey, 'danger');
  }

  private async showToast(messageKey: string, color: string) {
    const message = await this.translate.get(messageKey).toPromise();
    const toast = await this.toastController.create({
      message: message || 'An error occurred',
      duration: 3000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }
}