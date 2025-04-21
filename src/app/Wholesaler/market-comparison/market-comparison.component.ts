import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule, NavController, LoadingController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';
import { MarketComparisonService } from './market-comparison.service';
import { catchError, finalize, of } from 'rxjs';
import { GroupedPriceComparison, WholesellerPrice } from './market-comparison.service';

interface ProductPrices {
  [key: string]: number;
}

interface MarketPrices {
  [key: string]: ProductPrices;
}

@Component({
  selector: 'app-market-comparison',
  templateUrl: './market-comparison.component.html',
  styleUrls: ['./market-comparison.component.scss'],
  standalone: true,
  imports: [IonicModule, NgApexchartsModule, FormsModule, CommonModule]
})
export class MarketComparisonComponent implements OnInit {
  priceComparisonOptions: any;
  availableMandis = ['Azadpur Mandi', 'Ghazipur Mandi', 'Okhla Mandi'];
  availableProducts = ['Potato', 'Onion', 'Tomato', 'Cauliflower', 'Green Peas', 'Cabbage'];
  selectedMandis: string[] = ['Azadpur Mandi'];
  selectedProducts: string[] = ['Potato', 'Onion', 'Tomato'];
  isLoading: boolean = false;
  useRealData: boolean = true;

  private priceData: MarketPrices = {
    'Azadpur Mandi': { 'Potato': 45, 'Onion': 52, 'Tomato': 38, 'Cauliflower': 24, 'Green Peas': 33, 'Cabbage': 26 },
    'Ghazipur Mandi': { 'Potato': 42, 'Onion': 48, 'Tomato': 35, 'Cauliflower': 22, 'Green Peas': 31, 'Cabbage': 24 },
    'Okhla Mandi': { 'Potato': 48, 'Onion': 55, 'Tomato': 42, 'Cauliflower': 28, 'Green Peas': 36, 'Cabbage': 29 }
  };

  constructor(
    private navController: NavController,
    private marketComparisonService: MarketComparisonService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({ chevronBackOutline });
  }

  ngOnInit() {
    this.initializeCharts();
  }

  async showLoading() {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Loading price data...',
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: 'warning',
      buttons: [{ icon: 'close', role: 'cancel' }]
    });
    await toast.present();
  }

  goToTrends() {
    this.navController.navigateBack('/wholesaler/trends');
  }

onMandiChange(event: any) {
  if (this.selectedMandis.length && this.selectedProducts.length) {
    this.useRealData = true;  // Reset to try real data again
    this.updateChart();
  }
}

onProductChange(event: any) {
  if (this.selectedMandis.length && this.selectedProducts.length) {
    this.useRealData = true;  // Reset to try real data again
    this.updateChart();
  }
}

async updateChart() {
  if (this.useRealData) {
    const loading = await this.showLoading();
    try {
      const productIds = this.selectedProducts.map(name => this.getProductId(name));

      this.marketComparisonService.getWholesellerPriceComparison(productIds)
        .pipe(
          catchError(error => {
            console.error('API Error:', error);
            this.showToast('Unable to fetch real-time data. Using stored data.');
            this.useRealData = false;
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
            this.useRealData = false;
            this.updateChartWithFallbackData();
          }
        });
    } catch (error) {
      loading.dismiss();
      this.isLoading = false;
      this.useRealData = false;
      this.updateChartWithFallbackData();
    }
  } else {
    this.updateChartWithFallbackData();
  }
}

  private updateChartWithRealData(data: GroupedPriceComparison | GroupedPriceComparison[]) {
    const dataArray = Array.isArray(data) ? data : [data];

    const seriesData = this.selectedMandis.map(mandi => ({
      name: mandi,
      data: this.selectedProducts.map(productName => {
        const productData = dataArray.find(d => d.product_name === productName);
        if (productData) {
          const mandiPrice = productData.prices.find(
            price => price.wholeseller_id === this.getMandiId(mandi)
          );
          return mandiPrice ? mandiPrice.price_per_kg : 0;
        }
        return 0;
      })
    }));

    this.updateChartOptions(seriesData);
  }

  private updateChartWithFallbackData() {
    const seriesData = this.selectedMandis.map(mandi => ({
      name: mandi,
      data: this.selectedProducts.map(product => this.priceData[mandi][product])
    }));

    this.updateChartOptions(seriesData);
  }

  private updateChartOptions(seriesData: any[]) {
    this.priceComparisonOptions = {
      ...this.priceComparisonOptions,
      series: seriesData,
      xaxis: {
        ...this.priceComparisonOptions.xaxis,
        categories: this.selectedProducts
      }
    };
  }

  private initializeCharts() {
    this.setupChartOptions();
    this.updateChart();
  }

  private setupChartOptions() {
    this.priceComparisonOptions = {
      series: [],
      chart: {
        type: 'bar',
        height: 350,
        stacked: false,
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 5
        },
      },
      colors: ['#008FFB', '#00E396', '#FEB019'],
      xaxis: {
        categories: this.selectedProducts,
        title: { text: 'Products' }
      },
      yaxis: {
        title: { text: 'Price (₹/kg)' },
        labels: {
          formatter: (val: number) => `₹${val}`
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => `₹${val}/kg`
        }
      }
    };
  }

  private getProductId(productName: string): number {
    const productMap: { [key: string]: number } = {
      'Potato': 1,
      'Onion': 2,
      'Tomato': 3,
      'Cauliflower': 4,
      'Green Peas': 5,
      'Cabbage': 6
    };
    return productMap[productName] || 0;
  }

  private getMandiId(mandiName: string): number {
    const mandiMap: { [key: string]: number } = {
      'Azadpur Mandi': 1,
      'Ghazipur Mandi': 2,
      'Okhla Mandi': 3
    };
    return mandiMap[mandiName] || 0;
  }
}