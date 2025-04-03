import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stock-insights',
  template: `
    <ion-content>
      <ion-segment [(ngModel)]="selectedView" mode="ios">
        <ion-segment-button value="chart">
          <ion-label>Stock Levels</ion-label>
        </ion-segment-button>
        <ion-segment-button value="alerts">
          <ion-label>Low Stock</ion-label>
        </ion-segment-button>
      </ion-segment>

      <div [ngSwitch]="selectedView">
        <!-- Stock Levels Chart -->
        <div *ngSwitchCase="'chart'" class="chart-container">
          <ion-item class="warehouse-select">
            <ion-label>Select Warehouse/Mandi</ion-label>
            <ion-select [(ngModel)]="selectedWarehouse" (ionChange)="updateChartData()">
              <ion-select-option *ngFor="let warehouse of warehouses" [value]="warehouse">
                {{ warehouse }}
              </ion-select-option>
            </ion-select>
          </ion-item>

          <h3>Stock Levels - {{ selectedWarehouse }}</h3>
          <apx-chart
            [series]="stockLevelsOptions.series"
            [chart]="stockLevelsOptions.chart"
            [xaxis]="stockLevelsOptions.xaxis"
            [yaxis]="stockLevelsOptions.yaxis"
            [colors]="stockLevelsOptions.colors"
            [plotOptions]="stockLevelsOptions.plotOptions"
            [dataLabels]="stockLevelsOptions.dataLabels"
            [tooltip]="stockLevelsOptions.tooltip"
          ></apx-chart>
        </div>

        <!-- Low Stock Alerts -->
        <div *ngSwitchCase="'alerts'" class="chart-container">
          <h3>Low Stock Items</h3>
          <ion-list class="alerts-container">
            <ion-item *ngFor="let alert of lowStockAlerts" class="critical">
              <ion-label>
                <h2>{{ alert.product }}</h2>
                <p>Location: {{ alert.warehouse }}</p>
                <p>Current Stock: {{ alert.currentStock | number }} kg</p>
                <p>Required: {{ alert.threshold | number }} kg</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    .chart-container {
      width: 100%;
      padding: 20px;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    h3 {
      text-align: center;
      color: #333;
      margin-bottom: 20px;
    }
    .alerts-container {
      height: calc(100% - 60px);
      overflow-y: auto;
      padding: 0 10px;
    }
    ion-item.critical {
      --background: rgba(255, 68, 68, 0.1);
      margin-bottom: 8px;
      border-radius: 8px;
    }
  `],
  standalone: true,
  imports: [IonicModule, NgApexchartsModule, CommonModule, FormsModule],
})
export class StockInsightsComponent implements OnInit {
  selectedView: string = 'chart';
  selectedWarehouse: string = 'Azadpur Mandi';

  warehouses: string[] = ['Azadpur Mandi', 'Ghazipur Mandi', 'All Locations'];

  stockData: { [key: string]: { products: string[]; stock: number[] } } = {
    'Azadpur Mandi': {
      products: ['Potato', 'Onion', 'Tomato', 'Cauliflower', 'Green Peas', 'Cabbage'],
      stock: [6500, 8000, 4800, 4500, 5200, 3500]
    },
    'Ghazipur Mandi': {
      products: ['Potato', 'Onion', 'Tomato', 'Cauliflower', 'Green Peas', 'Cabbage'],
      stock: [8500, 12000, 6800, 4500, 7200, 5500]
    }
  };

  stockLevelsOptions: any;
  lowStockAlerts: any[] = [];

  ngOnInit() {
    this.initializeCharts();
    this.initializeAlerts();
  }

  updateChartData() {
    let newData = [];
    let newCategories = [];

    if (this.selectedWarehouse === 'All Locations') {
      // Sum stock across all warehouses
      const combinedStock = this.stockData['Azadpur Mandi'].products.map((product, index) => {
        return Object.values(this.stockData).reduce((sum, warehouse) => {
          return sum + (warehouse.stock[index] || 0);
        }, 0);
      });

      newData = combinedStock;
      newCategories = this.stockData['Azadpur Mandi'].products;
    } else {
      // Fetch stock for selected warehouse
      newData = this.stockData[this.selectedWarehouse].stock;
      newCategories = this.stockData[this.selectedWarehouse].products;
    }

    // Force Angular to detect changes
    this.stockLevelsOptions = Object.assign({}, this.stockLevelsOptions, {
      series: [{ name: 'Current Stock', data: newData }],
      xaxis: { categories: newCategories }
    });
  }

  private initializeCharts() {
    this.stockLevelsOptions = {
      series: [{ name: 'Current Stock', data: [] }],
      chart: { type: 'bar', height: 350, background: '#ffffff' },
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
    this.updateChartData();
  }

  private initializeAlerts() {
    const allStockData = [
      { product: 'Cauliflower', currentStock: 4500, threshold: 5000, warehouse: 'Azadpur Mandi' },
      { product: 'Potato', currentStock: 4800, threshold: 6000, warehouse: 'Ghazipur Mandi' }
    ];

    this.lowStockAlerts = allStockData.filter(item => item.currentStock < item.threshold);
  }
}
