//CREATE MATERIALIZED VIEW IN SQL AND THEN MAKE CHANGES HERE FOR THAT

import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule, NavController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';

interface ProductData {
  name: string;
  isSelected: boolean;
  data: number[];
}

@Component({
  template: `
    <ion-content>
    <ion-toolbar>
    <ion-buttons slot="start">
      <ion-button  color="dark" (click)="goToTrends()">
        <ion-icon name="chevron-back-outline"></ion-icon>
      </ion-button>
    </ion-buttons>
    <ion-title>Trends</ion-title>
  </ion-toolbar>
      <ion-grid class="ion-no-padding">
        <ion-row class="full-height">
          <!-- Filters Sidebar -->
          <ion-col size="12" size-md="3" class="sidebar">
            <div class="filters-container">
              <ion-item>
                <ion-label position="stacked">Time Range</ion-label>
                <ion-select [(ngModel)]="selectedTimeRange"
                          (ionChange)="updateCharts()"
                          interface="popover">
                          <ion-select-option value="3">3 Months</ion-select-option>
<ion-select-option value="6">6 Months</ion-select-option>
<ion-select-option value="12">12 Months</ion-select-option>
<ion-select-option value="18">18 Months</ion-select-option>
<ion-select-option value="24">24 Months</ion-select-option>
<ion-select-option value="36">36 Months</ion-select-option>
</ion-select>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Select Products</ion-label>
                <ion-select [(ngModel)]="selectedProducts"
                          [multiple]="true"
                          (ionChange)="onProductSelectionChange()"
                          interface="action-sheet"
                          [interfaceOptions]="customActionSheetOptions">
                  <div slot="header">
                    <ion-searchbar [(ngModel)]="searchTerm"
                                 (ionInput)="filterProducts()"
                                 placeholder="Search products">
                    </ion-searchbar>
                    <ion-item lines="none">
                      <ion-checkbox [(ngModel)]="allSelected"
                                  (ionChange)="toggleAllProducts()">
                        Select All
                      </ion-checkbox>
                    </ion-item>
                  </div>
                  <ion-select-option *ngFor="let product of filteredProducts"
                                   [value]="product.name">
                    {{product.name}}
                  </ion-select-option>
                </ion-select>
              </ion-item>
            </div>
          </ion-col>

          <!-- Charts Area -->
          <ion-col size="12" size-md="9" class="charts-area">
            <div class="charts-container">
              <!-- Seasonal Demand Chart -->
              <div class="chart-wrapper">
                <h3>Seasonal Demand Patterns</h3>
                <apx-chart
                  [series]="seasonalDemandOptions.series"
                  [chart]="seasonalDemandOptions.chart"
                  [xaxis]="seasonalDemandOptions.xaxis"
                  [yaxis]="seasonalDemandOptions.yaxis"
                  [colors]="seasonalDemandOptions.colors"
                  [tooltip]="seasonalDemandOptions.tooltip">
                </apx-chart>
              </div>

              <!-- Product Demand Chart -->
              <div class="chart-wrapper">
                <h3>Product Demand Comparison</h3>
                <apx-chart
                  [series]="productDemandOptions.series"
                  [chart]="productDemandOptions.chart"
                  [xaxis]="productDemandOptions.xaxis"
                  [yaxis]="productDemandOptions.yaxis"
                  [colors]="productDemandOptions.colors"
                  [plotOptions]="productDemandOptions.plotOptions"
                  [tooltip]="productDemandOptions.tooltip">
                </apx-chart>
              </div>
            </div>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  `,

  styles: [`
    .full-height {
      height: 100%;
    }

    .sidebar {
      background: #f5f5f5;
      height: 100%;
    }

    .filters-container {
      padding: 16px;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .products-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: #e0e0e0;
      border-radius: 8px;
    }

    .product-search {
      --background: #ffffff;
      --box-shadow: none;
      --border-radius: 8px;
    }

    .product-list {
      overflow-y: auto;
      flex: 1;
      background: #ffffff;
      border-radius: 8px;
      padding: 8px;
    }

    .product-list ion-item {
      --background: transparent;
      --padding-start: 8px;
      --padding-end: 8px;
      --min-height: 40px;
      margin-bottom: 4px;
    }

    .charts-area {
      padding: 16px;
      height: 100%;
    }

    .chart-container {
      background: #ffffff;
      border-radius: 10px;
      padding: 20px;
      height: calc(100vh - 32px);
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    h3 {
      color: #333;
      margin: 0 0 20px;
      text-align: center;
      font-size: 1.2rem;
    }

    @media (max-width: 768px) {
      .sidebar {
        height: auto;
      }

      .filters-container {
        max-height: 300px;
      }

      .chart-container {
        height: 400px;
      }

      ion-select::part(icon) {
    color: #666;
  }

  ion-searchbar {
    padding: 8px 16px;
    --background: #f5f5f5;
    --border-radius: 8px;
  }

  ion-select::part(placeholder),
  ion-select::part(text) {
    color: #333;
    font-size: 14px;
  }

  .select-header {
    padding: 16px;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }
    }
  `],
  standalone: true,
  imports: [IonicModule, NgApexchartsModule, FormsModule, CommonModule],
})
export class DemandTrendsComponent implements OnInit {
  constructor(private navController: NavController) {
    addIcons({ chevronBackOutline})
   }
   goToTrends() {
    this.navController.navigateBack('/wholesaler/trends'); // Change the path as per your route
  }

  selectedTimeRange = '3';
  searchTerm = '';
  allSelected = false;
  products: ProductData[] = [
    { name: 'Potato', isSelected: true, data: [] },
    { name: 'Tomato', isSelected: true, data: [] },
    { name: 'Onion', isSelected: false, data: [] },
    { name: 'Cauliflower', isSelected: false, data: [] },
    { name: 'Green Peas', isSelected: false, data: [] },
    { name: 'Cabbage', isSelected: false, data: [] }
  ];
  filteredProducts: ProductData[] = [];
  seasonalDemandOptions: any;
  productDemandOptions: any;

  selectedProducts: string[] = ['Potato', 'Tomato'];
  customActionSheetOptions = {
    header: 'Select Products',
    subHeader: 'Choose products to display in charts'
  };

  ngOnInit() {
    this.filteredProducts = [...this.products];
    this.loadInitialData();
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

  private loadInitialData() {
    this.products.forEach(product => {
      product.data = Array.from({ length: 36 }, () =>
        Math.floor(Math.random() * (100000 - 20000) + 20000)
      );

    });
  }

  updateCharts() {
    const months = parseInt(this.selectedTimeRange);
    const selectedProducts = this.products.filter(p => p.isSelected);

    this.updateSeasonalDemandChart(selectedProducts, months);
    this.updateProductDemandChart(selectedProducts);
  }

  private updateSeasonalDemandChart(selectedProducts: ProductData[], months: number) {
    this.seasonalDemandOptions = {
      series: selectedProducts.map(product => ({
        name: product.name,
        data: product.data.slice(-months)
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
        categories: this.getLastXMonths(months)
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
    const currentData = selectedProducts.map(p => p.data[p.data.length - 1]);
    const previousData = selectedProducts.map(p => p.data[p.data.length - 2]);

    this.productDemandOptions = {
      series: [{
        name: 'Current Month',
        data: currentData
      }, {
        name: 'Previous Month',
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

  private getLastXMonths(count: number): string[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const result = [];

    for (let i = count - 1; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      result.push(months[monthIndex]);
    }
    return result;
  }
}