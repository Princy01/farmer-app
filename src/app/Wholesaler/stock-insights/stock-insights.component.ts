import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';

interface SlowMovingProduct {
  product: string;
  warehouse: string;
  currentStock: number;
  weeklySales: number;
  daysInStock: number;
}

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
  constructor(private navController: NavController) {
    addIcons({ chevronBackOutline})
   }
   goToTrends() {
    this.navController.navigateBack('/wholesaler/trends'); // Change the path as per your route
  }
  
  selectedView: string = 'chart';
  selectedWarehouse: string = 'Azadpur Mandi';
  slowMovingProducts: SlowMovingProduct[] = [];

  warehouses: string[] = ['Azadpur Mandi', 'Ghazipur Mandi'];

  stockData: StockData = {
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
    this.initializeSlowMoving();
  }

  updateChartData() {
    const warehouseData = this.stockData[this.selectedWarehouse];
    this.stockLevelsOptions = Object.assign({}, this.stockLevelsOptions, {
      series: [{
        name: 'Current Stock',
        data: warehouseData.stock
      }],
      xaxis: {
        categories: warehouseData.products
      }
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

  private initializeSlowMoving() {
    const slowMovingData: SlowMovingProduct[] = [
      {
        product: 'Cabbage',
        warehouse: 'Azadpur Mandi',
        currentStock: 3500,
        weeklySales: 250,
        daysInStock: 15
      },
      {
        product: 'Green Peas',
        warehouse: 'Ghazipur Mandi',
        currentStock: 7200,
        weeklySales: 400,
        daysInStock: 12
      }
    ];

    this.slowMovingProducts = slowMovingData.filter(item =>
      item.daysInStock > 10 && item.weeklySales < 500
    );
  }
}