// import { Component, OnInit } from '@angular/core';
// import { NgApexchartsModule } from 'ng-apexcharts';
// import { IonicModule, NavController } from '@ionic/angular';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { addIcons } from 'ionicons';
// import { chevronBackOutline } from 'ionicons/icons'

// interface SlowMovingProduct {
//   product: string;
//   warehouse: string;
//   currentStock: number;
//   weeklySales: number;
//   daysInStock: number;
// }

// interface WarehouseData {
//   products: string[];
//   stock: number[];
// }

// interface StockData {
//   [key: string]: WarehouseData;
// }

// @Component({
//   selector: 'app-stock-insights',
//   templateUrl: './stock-insights.component.html',
//   styleUrls: ['./stock-insights.component.scss'],
//   standalone: true,
//   imports: [IonicModule, NgApexchartsModule, CommonModule, FormsModule],
// })
// export class StockInsightsComponent implements OnInit {
//   constructor(private navController: NavController) {
//     addIcons({ chevronBackOutline})
//    }
//    goToTrends() {
//     this.navController.navigateBack('/wholesaler/trends'); // Change the path as per your route
//   }

//   selectedView: string = 'chart';
//   selectedWarehouse: string = 'Azadpur Mandi';
//   slowMovingProducts: SlowMovingProduct[] = [];

//   warehouses: string[] = ['Azadpur Mandi', 'Ghazipur Mandi'];

//   stockData: StockData = {
//     'Azadpur Mandi': {
//       products: ['Potato', 'Onion', 'Tomato', 'Cauliflower', 'Green Peas', 'Cabbage'],
//       stock: [6500, 8000, 4800, 4500, 5200, 3500]
//     },
//     'Ghazipur Mandi': {
//       products: ['Potato', 'Onion', 'Tomato', 'Cauliflower', 'Green Peas', 'Cabbage'],
//       stock: [8500, 12000, 6800, 4500, 7200, 5500]
//     }
//   };

//   stockLevelsOptions: any;
//   lowStockAlerts: any[] = [];

//   ngOnInit() {
//     this.initializeCharts();
//     this.initializeAlerts();
//     this.initializeSlowMoving();
//   }

//   updateChartData() {
//     const warehouseData = this.stockData[this.selectedWarehouse];
//     this.stockLevelsOptions = Object.assign({}, this.stockLevelsOptions, {
//       series: [{
//         name: 'Current Stock',
//         data: warehouseData.stock
//       }],
//       xaxis: {
//         categories: warehouseData.products
//       }
//     });
//   }

//   private initializeCharts() {
//     this.stockLevelsOptions = {
//       series: [{ name: 'Current Stock', data: [] }],
//       chart: { type: 'bar', height: 350, background: '#ffffff' },
//       plotOptions: {
//         bar: {
//           horizontal: true,
//           barHeight: '50%',
//           distributed: true
//         }
//       },
//       colors: ['#33b2df', '#546E7A', '#d4526e', '#13d8aa', '#A5978B', '#2b908f'],
//       dataLabels: {
//         enabled: true,
//         formatter: (val: number) => val.toLocaleString() + ' kg'
//       },
//       xaxis: { categories: [] },
//       yaxis: { labels: { show: true } },
//       tooltip: {
//         y: {
//           formatter: (val: number) => val.toLocaleString() + ' kg'
//         }
//       }
//     };
//     this.updateChartData();
//   }

//   private initializeAlerts() {
//     const allStockData = [
//       { product: 'Cauliflower', currentStock: 4500, threshold: 5000, warehouse: 'Azadpur Mandi' },
//       { product: 'Potato', currentStock: 4800, threshold: 6000, warehouse: 'Ghazipur Mandi' }
//     ];

//     this.lowStockAlerts = allStockData.filter(item => item.currentStock < item.threshold);
//   }

//   private initializeSlowMoving() {
//     const slowMovingData: SlowMovingProduct[] = [
//       {
//         product: 'Cabbage',
//         warehouse: 'Azadpur Mandi',
//         currentStock: 3500,
//         weeklySales: 250,
//         daysInStock: 15
//       },
//       {
//         product: 'Green Peas',
//         warehouse: 'Ghazipur Mandi',
//         currentStock: 7200,
//         weeklySales: 400,
//         daysInStock: 12
//       }
//     ];

//     this.slowMovingProducts = slowMovingData.filter(item =>
//       item.daysInStock > 10 && item.weeklySales < 500
//     );
//   }
// }

import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule, NavController, LoadingController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';
import { StockInsightsService } from './stock-insights.service';
import { catchError, finalize, of } from 'rxjs';

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
  selectedView: string = 'chart';
  selectedWarehouse: string = 'Azadpur Mandi';
  slowMovingProducts: SlowMovingProduct[] = [];
  warehouses: string[] = ['Azadpur Mandi', 'Ghazipur Mandi'];
  stockLevelsOptions: any;
  lowStockAlerts: any[] = [];
  isLoading: boolean = false;
  useRealData: boolean = true;

  // Dummy data
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

  constructor(
    private navController: NavController,
    private stockInsightsService: StockInsightsService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({ chevronBackOutline });
  }

  ngOnInit() {
    this.initializeData();
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

  toggleDataSource() {
    this.useRealData = !this.useRealData;
    this.initializeData();
  }

  private async initializeData() {
    await this.initializeCharts();
    await this.initializeAlerts();
    await this.initializeSlowMoving();
  }

  private async initializeCharts() {
    this.setupChartOptions();
    if (this.useRealData) {
      const loading = await this.showLoading();
      try {
        const mandiId = this.selectedWarehouse === 'Azadpur Mandi' ? 1 : 2;
        this.stockInsightsService.getCurrentStockByMandi(mandiId)
          .pipe(
            catchError(error => {
              console.error('API Error:', error);
              this.showErrorToast('Failed to fetch stock data. Using fallback data.');
              return of(null);
            }),
            finalize(() => {
              loading.dismiss();
              this.isLoading = false;
            })
          )
          .subscribe(data => {
            if (data) {
              this.updateChartWithRealData(data);
            } else {
              this.useDummyChartData();
            }
          });
      } catch (error) {
        this.useDummyChartData();
        loading.dismiss();
        this.showErrorToast('An error occurred. Using fallback data.');
      }
    } else {
      this.useDummyChartData();
    }
  }

  private setupChartOptions() {
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
  }

  private updateChartWithRealData(data: any[]) {
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

  private useDummyChartData() {
    const warehouseData = this.stockData[this.selectedWarehouse];
    this.stockLevelsOptions = {
      ...this.stockLevelsOptions,
      series: [{
        name: 'Current Stock',
        data: warehouseData.stock
      }],
      xaxis: {
        categories: warehouseData.products
      }
    };
  }

  private async initializeAlerts() {
    if (this.useRealData) {
      const loading = await this.showLoading();
      try {
        this.stockInsightsService.getLowStockItems()
          .pipe(
            catchError(error => {
              console.error('API Error:', error);
              this.showErrorToast('Failed to fetch stock data. Using fallback data.');
              return of(null);
            }),
            finalize(() => {
              loading.dismiss();
              this.isLoading = false;
            })
          )
          .subscribe(data => {
            if (data) {
              this.lowStockAlerts = data.map(item => ({
                product: item.product_name,
                currentStock: item.stock_left,
                threshold: item.minimum_stock_level,
                warehouse: item.mandi_name
              }));
            } else {
              this.useDummyAlerts();
            }
          });
      } catch (error) {
        this.useDummyAlerts();
        loading.dismiss();
        this.showErrorToast('An error occurred. Using fallback data.');
      }
    } else {
      this.useDummyAlerts();
    }
  }

  private useDummyAlerts() {
    const allStockData = [
      { product: 'Cauliflower', currentStock: 4500, threshold: 5000, warehouse: 'Azadpur Mandi' },
      { product: 'Potato', currentStock: 4800, threshold: 6000, warehouse: 'Ghazipur Mandi' }
    ];
    this.lowStockAlerts = allStockData.filter(item => item.currentStock < item.threshold);
  }

  private async initializeSlowMoving() {
    if (this.useRealData) {
      const loading = await this.showLoading();
      try {
        this.stockInsightsService.getLeastStockedProducts()
          .pipe(
            catchError(error => {
              console.error('API Error:', error);
              this.showErrorToast('Failed to fetch stock data. Using fallback data.');
              return of(null);
            }),
            finalize(() => {
              loading.dismiss();
              this.isLoading = false;
            })
          )
          .subscribe(data => {
            if (data) {
              this.slowMovingProducts = data.map(item => ({
                product: item.product_name,
                warehouse: item.mandi_name,
                currentStock: item.stock_left,
                weeklySales: 250, // Default value
                daysInStock: 15 // Default value
              }));
            } else {
              this.useDummySlowMoving();
            }
          });
      } catch (error) {
        this.useDummySlowMoving();
        loading.dismiss();
        this.showErrorToast('An error occurred. Using fallback data.');
      }
    } else {
      this.useDummySlowMoving();
    }
  }

  private useDummySlowMoving() {
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

  updateChartData() {
    if (!this.useRealData) {
      this.useDummyChartData();
    }
  }
}