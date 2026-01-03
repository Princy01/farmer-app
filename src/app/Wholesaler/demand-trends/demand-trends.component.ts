import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule, NavController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';
import { DemandTrendsService, DemandPatternRow, ProductDemandComparisonRow } from './demand-trends.service';

interface ProductData {
  name: string;
  isSelected: boolean;
  data: number[];
}

@Component({
  selector: 'app-demand-trends',
  standalone: true,
  imports: [IonicModule, NgApexchartsModule, FormsModule, CommonModule],
  templateUrl: './demand-trends.component.html',
  styleUrls: ['./demand-trends.component.scss']
})
export class DemandTrendsComponent implements OnInit {
  constructor(private navController: NavController, private demandService: DemandTrendsService) {
    addIcons({ chevronBackOutline })
  }
  goToTrends() {
    this.navController.navigateBack('/wholesaler/trends'); // Change the path as per your route
  }

  selectedTimeRange = 'monthly';
  searchTerm = '';
  allSelected = false;
  products: ProductData[] = [];
  filteredProducts: ProductData[] = [];
  seasonalDemandOptions: any;
  productDemandOptions: any;
  comparisonData: ProductDemandComparisonRow[] = [];


  selectedProducts: string[] = [];
  customActionSheetOptions = {
    header: 'Select Products',
    subHeader: 'Choose products to display in charts'
  };

  ngOnInit() {
    this.loadProducts();
    this.syncProductSelections();
    this.updateCharts();
  }

  onProductSelectionChange() {
    this.products.forEach(p => {
      p.isSelected = this.selectedProducts.includes(p.name);
    });
    this.updateCharts();
  }

  filterProducts() {
    if (!this.searchTerm.trim()) {
      this.filteredProducts = [...this.products];
      return;
    }

    const search = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(product =>
      product.name.toLowerCase().includes(search)
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
    this.products.forEach(p => {
      p.isSelected = this.selectedProducts.includes(p.name);
    });
    this.allSelected = this.selectedProducts.length === this.products.length;
  }

  private loadProducts() {
    // Fetch demand patterns to extract unique products
    this.demandService.getDemandPatterns(this.selectedTimeRange).subscribe(data => {
      const productMap = new Map<string, ProductData>();
      data.forEach(row => {
        if (!productMap.has(row.product_name)) {
          productMap.set(row.product_name, { name: row.product_name, isSelected: false, data: [] });
        }
      });
      this.products = Array.from(productMap.values());
      this.filteredProducts = [...this.products];
      this.selectedProducts = this.products.slice(0, 2).map(p => p.name); // Default select first two
      this.syncProductSelections();
      this.loadInitialData();
    });
  }

  private loadInitialData() {
    // Fetch demand patterns for seasonal chart
    this.demandService.getDemandPatterns(this.selectedTimeRange).subscribe({
      next: (patterns) => {
        const productDataMap = new Map<string, Map<string, number>>();
        patterns.forEach(row => {
          if (!productDataMap.has(row.product_name)) {
            productDataMap.set(row.product_name, new Map());
          }
          const periodKey = this.getPeriodKey(row.period, this.selectedTimeRange);
          productDataMap.get(row.product_name)!.set(periodKey, row.total_quantity);
        });

        // Sort periods
        const allPeriods = Array.from(new Set(patterns.map(p => this.getPeriodKey(p.period, this.selectedTimeRange)))).sort();

        this.products.forEach(product => {
          product.data = allPeriods.map(period => productDataMap.get(product.name)?.get(period) || 0);
        });

        // Fetch comparison for current period
        this.demandService.getProductDemandComparison(this.selectedTimeRange).subscribe({
          next: (comparison) => {
            this.comparisonData = comparison;
            this.updateCharts();
          },
          error: (err) => {
            console.error('Failed to load product demand comparison:', err);
          }
        });
      },
      error: (err) => {
        console.error('Failed to load demand patterns:', err);
      }
    });
  }

  updateCharts() {
    const periods = this.getPeriodsCount(this.selectedTimeRange);
    const selectedProducts = this.products.filter(p => p.isSelected);

    this.updateSeasonalDemandChart(selectedProducts, periods);
    this.updateProductDemandChart(selectedProducts);
  }

  private updateSeasonalDemandChart(selectedProducts: ProductData[], periods: number) {
    this.seasonalDemandOptions = {
      series: selectedProducts.map(product => ({
        name: product.name,
        data: product.data.slice(-periods)
      })),
      chart: {
        height: 350,
        type: 'line',
        background: '#ffffff',
        toolbar: {
          show: false
        }
      },
      colors: ['#FF6B6B', '#45B7D1', '#4ECDC4', '#96CEB4', '#FFEEAD', '#D4A5A5'],
      xaxis: {
        categories: this.getLastXPeriods(periods, this.selectedTimeRange)
      },
      yaxis: {
        title: {
          text: 'Demand (kg)'
        },
        labels: {
          formatter: (val: number) => val.toLocaleString() + ' kg'
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => val.toLocaleString() + ' kg'
        }
      }
    };
  }

  private updateProductDemandChart(selectedProducts: ProductData[]) {
    // Use comparison data for current period, filtered to selected products
    const currentData = selectedProducts.map(p => {
      const comp = this.comparisonData.find(c => c.product_name === p.name);
      return comp ? comp.total_quantity : 0;
    });
    // Previous period remains from patterns data
    const previousData = selectedProducts.map(p => p.data[p.data.length - 2] || 0);

    this.productDemandOptions = {
      series: [{
        name: 'Current Period',
        data: currentData
      }, {
        name: 'Previous Period',
        data: previousData
      }],
      chart: {
        type: 'bar',
        height: 350,
        background: '#ffffff',
        toolbar: {
          show: false
        }
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
        title: {
          text: 'Demand (kg)'
        },
        labels: {
          formatter: (val: number) => val.toLocaleString() + ' kg'
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => val.toLocaleString() + ' kg'
        }
      }
    };
  }

  private getPeriodKey(period: string, range: string): string {
    const date = new Date(period);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    switch (range) {
      case 'weekly':
        // Approximate week as YYYY-WW
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
    // Default number of periods to display
    switch (range) {
      case 'weekly': return 12; // Last 12 weeks
      case 'monthly': return 12; // Last 12 months
      case 'quarterly': return 4; // Last 4 quarters
      case 'yearly': return 5; // Last 5 years
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
    this.selectedTimeRange = newRange;
    this.products = [];  // Reset products to avoid stale data
    this.filteredProducts = [];
    this.comparisonData = [];
    this.selectedProducts = [];
    this.loadProducts();  // Reload products and data for the new range
  }
}