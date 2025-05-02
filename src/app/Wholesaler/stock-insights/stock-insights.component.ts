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
import { CurrentStockData, LeastStockedData, MandiBasicInfo, StockInsightsService } from './stock-insights.service';
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
  selectedWarehouse: MandiBasicInfo | null = null;
  slowMovingProducts: LeastStockedData[] = [];
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
    lowStockAlerts: any[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private navController: NavController,
    private stockInsightsService: StockInsightsService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({ chevronBackOutline });
  }

  ngOnInit() {
    this.loadMandis();
  }

  private async loadMandis() {
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
            this.error = 'No mandis available';
          }
        },
        error: (error) => {
          console.error('Failed to load mandis:', error);
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
          error: (error) => {
            console.error('Failed to fetch low stock items:', error);
            this.showErrorToast('Failed to fetch low stock alerts');
          }
        });
    } catch (error) {
      loading.dismiss();
      this.showErrorToast('An error occurred while fetching alerts');
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
    const loading = await this.showLoading();
    try {
      this.stockInsightsService.getLeastStockedProducts()
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
          error: (error) => {
            console.error('Failed to fetch slow moving products:', error);
            this.showErrorToast('Failed to fetch slow moving products');
          }
        });
    } catch (error) {
      loading.dismiss();
      this.showErrorToast('An error occurred while fetching slow moving products');
    }
  }

  async updateChartData() {
    if (!this.selectedWarehouse) return;

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
          error: (error) => {
            console.error('Failed to fetch stock data:', error);
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
}