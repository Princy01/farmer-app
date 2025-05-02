import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule, NavController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';
import { SalesTrendsService, SalesTrend, TopSellingProduct } from './sales-trends.service';
import { catchError, finalize, of } from 'rxjs';

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
  imports: [IonicModule, NgApexchartsModule, FormsModule, CommonModule],
})
export class SalesTrendsComponent implements OnInit {
  selectedView: string = 'trends';
  selectedPeriod: string = 'monthly';
  selectedMetric: string = 'volume';
  chartOptions: any
  // = {
  //   series: [],
  //   chart: {
  //     height: 350,
  //     type: 'line',
  //     background: '#ffffff',
  //     toolbar: { show: true }
  //   },
  //   colors: ['#2E93fA', '#66DA26'],
  //   xaxis: { categories: [] },
  //   yaxis: [
  //     {
  //       title: { text: 'Revenue (₹)' },
  //       labels: { formatter: (value: number) => `₹${(value / 1000).toFixed(0)}K` }
  //     },
  //     {
  //       opposite: true,
  //       title: { text: 'Orders' },
  //       labels: { formatter: (value: number) => `${Math.round(value)}` }
  //     }
  //   ],
  //   title: {
  //     text: 'Sales Trends',
  //     align: 'center',
  //     style: { fontSize: '16px' },
  //     margin: 40
  //   }
  // };
  topProductsOptions: any
  // = {
  //   series: [{
  //     name: 'Sales Volume',
  //     data: []
  //   }],
  //   chart: {
  //     type: 'bar',
  //     height: 450,
  //     background: '#ffffff',
  //     toolbar: { show: false }
  //   },
  //   xaxis: {
  //     categories: []
  //   },
  //   yaxis: {
  //     title: {
  //       text: 'Revenue (₹)'
  //     },
  //     labels: {
  //       formatter: (value: number) =>
  //       `₹${(value / 1000).toFixed(0)}K`
  //   }
  //   },
  //   colors: [
  //     '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  //     '#FFD93D', '#6C5B7B', '#355C7D', '#F67280', '#2A363B'
  //   ],
  //   title: {
  //     text: `Top Products by Revenue - ${this.capitalize(this.selectedPeriod)}`,
  //     align: 'center',
  //     style: {
  //       fontSize: '16px'
  //     },
  //     margin: 20
  //   },
  // };

    useRealData: boolean = true;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private navController: NavController,
    private salesTrendsService: SalesTrendsService,
    private loadingController: LoadingController
  ) {
    addIcons({ chevronBackOutline });
  }

  ngOnInit() {
    // Set initial data
    this.selectedView = 'trends';
    this.selectedPeriod = 'monthly';
    this.selectedMetric = 'volume';

    // Initialize charts after a brief delay to ensure template is ready
    setTimeout(() => {
      this.initializeCharts();
    }, 0);
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

  onViewChange() {
    if (this.selectedView === 'trends') {
      this.updateTrendsChart();
    } else {
      this.updateTopProductsChart();
    }
  }

  onPeriodChange() {
    if (this.selectedView === 'trends') {
      this.useRealData = true;
      this.updateTrendsChart();
    } else {
      this.updateTopProductsChart();
    }
  }

  onMetricChange() {
    if (this.selectedView === 'products') {
      this.updateTopProductsChart();
    }
  }

  toggleDataSource() {
    this.useRealData = !this.useRealData;
    this.errorMessage = '';
    this.initializeCharts();
  }

  private initializeCharts() {
    this.updateTrendsChart();
    this.updateTopProductsChart();
  }

  private async updateTrendsChart() {
    if (!this.useRealData) {
      const dummyData = this.getDataForPeriod(this.selectedPeriod);
      this.updateTrendsChartOptions(dummyData.values.map((value, index) => ({
        date: dummyData.categories[index],
        total_sales: value
      })));
      return;
    }
    const loading = await this.showLoading();
    try{
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
          this.errorMessage = 'Failed to fetch real data. Falling back to dummy data.';
          this.useRealData = false;
          const dummyData = this.getDataForPeriod(this.selectedPeriod);
          return of(dummyData.values.map((value, index) => ({
            date: dummyData.categories[index],
            total_sales: value
          })));
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
    this.chartOptions = {
      series: [
        {
          name: 'Total Revenue',
          data: data.map(item => item.total_revenue)
        },
        {
          name: 'Total Orders',
          data: data.map(item => item.total_orders)
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
        categories: data.map(item => item.month_year)
      },
      yaxis: [
        {
          title: {
            text: 'Revenue (₹)'
          },
          labels: {
            formatter: (value: number) => `₹${(value / 1000).toFixed(0)}K`
          }
        },
        {
          opposite: true,
          title: {
            text: 'Orders'
          },
          labels: {
            formatter: (value: number) => `${Math.round(value)}`
          }
        }
      ],
      title: {
        text: `${this.capitalize(this.selectedPeriod)} Sales Trends`,
        align: 'center',
        style: {
          fontSize: '16px'
        },
        margin: 40
      }
    };
  }

  private async updateTopProductsChart() {
    let loading: any;
    if (this.useRealData) {
      loading = await this.showLoading();
      let dataObservable;
      switch (this.selectedPeriod) {
        case 'daily':
          dataObservable = this.salesTrendsService.getTopSellingDaily();
          break;
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
          this.errorMessage = 'Failed to fetch top products data. Falling back to dummy data.';
          this.useRealData = false;
          return of(this.getTopProductsForPeriod(this.selectedPeriod).map(item => ({
            product_id: 0,
            product_name: item.name,
            mandi_id: 0,
            mandi_name: null,
            unit_id: 1,
            quantity: item.volume,
            price: item.price,
            total_quantity_kg: item.volume,
            actual_delivery_date: new Date().toISOString(),
            total_price: item.price
          } as TopSellingProduct)));
        }),
        finalize(() => {
          loading?.dismiss();
          this.isLoading = false;
        })
      ).subscribe(products => {
        this.updateTopProductsChartOptions(products);
      });
    } else {
      const productData = this.getTopProductsForPeriod(this.selectedPeriod);
      const isVolume = this.selectedMetric === 'volume';

      const values = productData.map(item => isVolume ? item.volume : item.price);
      const sortedData = [...productData]
        .sort((a, b) => (isVolume ? b.volume - a.volume : b.price - a.price));

      this.topProductsOptions = {
        series: [{
          name: isVolume ? 'Sales Volume' : 'Sales Revenue',
          data: sortedData.map(item => isVolume ? item.volume : item.price)
        }],
        chart: {
          type: 'bar',
          height: 450,
          background: '#ffffff',
          toolbar: {
            show: false
          },
          animations: {
            enabled: true
          },
          foreColor: '#333',
          fontFamily: 'inherit'
        },
        grid: {
          padding: {
            bottom: 70
          },
          xaxis: {
            lines: {
              show: true
            }
          }
        },
        plotOptions: {
          bar: {
            horizontal: false,
            borderRadius: 4,
            columnWidth: '60%'
          }
        },
        dataLabels: {
          enabled: true,
          formatter: (value: number) => isVolume ?
            `${value}kg` :
            `₹${(value / 1000).toFixed(0)}K`,
          style: {
            fontSize: '7px',
            colors: ['#000']
          }
        },
        xaxis: {
          categories: sortedData.map(item => item.name),
          title: {
            text: 'Products & Mandi Location',
            offsetY: 70,
            style: {
              fontSize: '14px'
            },
            floating: false
          },
          labels: {
            rotate: -90,
            style: {
              fontSize: '11px'
            }
          }
        },
        yaxis: {
          title: {
            text: isVolume ? 'Sales Volume (kg)' : 'Sales Revenue (₹)'
          },
          labels: {
            formatter: (value: number) => isVolume ?
              `${value} kg` :
              `₹${(value / 1000).toFixed(0)}K`
          }
        },
        colors: [
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
          '#FFD93D', '#6C5B7B', '#355C7D', '#F67280', '#2A363B'
        ],
        title: {
          text: `Top Products by ${isVolume ? 'Volume' : 'Revenue'} - ${this.capitalize(this.selectedPeriod)}`,
          align: 'center',
          style: {
            fontSize: '16px'
          },
          margin: 20
        },
        tooltip: {
          y: {
            formatter: (value: number) => isVolume ?
              `${value} kg` :
              `₹${value.toLocaleString()}`
          }
        }
      }
    };
  }

  private updateTopProductsChartOptions(products: TopSellingProduct[]) {
    const isVolume = this.selectedMetric === 'volume';
console.log('Top Products:', products);
     // Sort products by volume or revenue
  const sortedData = [...products].sort((a, b) =>
    isVolume ?
      (b.total_quantity_kg || 0) - (a.total_quantity_kg || 0) :
      (b.total_price || 0) - (a.total_price || 0)
  );

  // Take top 10 products
  const top10Products = sortedData.slice(0, 10);

  this.topProductsOptions = {
    series: [{
      name: isVolume ? 'Sales Volume (kg)' : 'Sales Revenue (₹)',
      data: top10Products.map(item =>
        isVolume ? item.total_quantity_kg : item.total_price
      )
    }],
    chart: {
            type: 'bar',
            height: 450,
            background: '#ffffff',
            toolbar: {
              show: false
            },
            animations: {
              enabled: true
            },
            foreColor: '#333',
            fontFamily: 'inherit'
          },
          grid: {
            padding: {
              bottom: 70
            },
            xaxis: {
              lines: {
                show: true
              }
            }
          },
          plotOptions: {
            bar: {
              horizontal: false,
              borderRadius: 4,
              columnWidth: '60%'
            }
          },
          dataLabels: {
            enabled: true,
            formatter: (value: number) => isVolume ?
              `${value}kg` :
              `₹${(value / 1000).toFixed(0)}K`,
            style: {
              fontSize: '7px',
              colors: ['#000']
            }
          },
          xaxis: {
            categories: top10Products.map(item =>
              `${item.product_name || 'Unknown'} (${item.mandi_name || 'Unknown Mandi'})`
            ),
            title: {
              text: 'Products',
              offsetY: 70,
              style: {
                fontSize: '14px'
              },
              floating: false
            },
            labels: {
              rotate: -90,
              style: {
                fontSize: '11px'
              }
            }
          },
          yaxis: {
            title: {
              text: isVolume ? 'Sales Volume (kg)' : 'Revenue (₹)'
            },
            labels: {
              formatter: (value: number) => isVolume ?
              `${value?.toFixed(2)} kg` :
              `₹${(value / 1000).toFixed(0)}K`
          }
          },
          colors: [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
            '#FFD93D', '#6C5B7B', '#355C7D', '#F67280', '#2A363B'
          ],
          title: {
            text: `Top Products by ${isVolume ? 'Volume' : 'Revenue'} - ${this.capitalize(this.selectedPeriod)}`,
            align: 'center',
            style: {
              fontSize: '16px'
            },
            margin: 20
          },
          tooltip: {
            y: {
              formatter: (value: number) => isVolume ?
                `${value} kg` :
                `₹${value.toLocaleString()}`
            }
          }
        };
      }

  private getTopProductsForPeriod(period: string): ProductData[] {
    const base = {
      weekly: 1000,
      monthly: 4000,
      quarterly: 12000,
      yearly: 50000
    }[period] || 1000;

    const priceFactors = {
      'Onion': 20,
      'Potato': 15,
      'Tomato': 25,
      'Cabbage': 12,
      'Cauliflower': 30,
      'Green Peas': 40,
      'Carrot': 18,
      'Bitter Gourd': 35,
      'Lady Finger': 22,
      'Brinjal': 16
    };

    return [
      { name: 'Onion (Lasalgaon Mandi)', volume: base + 500, price: (base + 500) * priceFactors['Onion'] },
      { name: 'Potato (Agra Mandi)', volume: base + 300, price: (base + 300) * priceFactors['Potato'] },
      { name: 'Tomato (Kolar Mandi)', volume: base + 200, price: (base + 200) * priceFactors['Tomato'] },
      { name: 'Cabbage (Pune Mandi)', volume: base - 100, price: (base - 100) * priceFactors['Cabbage'] },
      { name: 'Cauliflower (Delhi Mandi)', volume: base - 300, price: (base - 300) * priceFactors['Cauliflower'] },
      { name: 'Green Peas (Indore Mandi)', volume: base - 500, price: (base - 500) * priceFactors['Green Peas'] },
      { name: 'Carrot (Bangalore Mandi)', volume: base - 800, price: (base - 800) * priceFactors['Carrot'] },
      { name: 'Bitter Gourd (Chennai Mandi)', volume: base - 900, price: (base - 900) * priceFactors['Bitter Gourd'] },
      { name: 'Lady Finger (Ahmedabad Mandi)', volume: base - 1000, price: (base - 1000) * priceFactors['Lady Finger'] },
      { name: 'Brinjal (Kolkata Mandi)', volume: base - 1200, price: (base - 1200) * priceFactors['Brinjal'] }
    ];
  }

  private getDataForPeriod(period: string): { categories: string[], values: number[] } {
    switch (period) {
      case 'weekly':
        return {
          categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          values: [42000, 38000, 45000, 50000, 49000, 60000, 55000]
        };
      case 'monthly':
        return {
          categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          values: [320000, 450000, 380000, 540000, 420000, 680000, 720000, 850000, 690000, 920000, 850000, 990000]
        };
      case 'quarterly':
        return {
          categories: ['Q1', 'Q2', 'Q3', 'Q4'],
          values: [1150000, 1640000, 2260000, 2760000]
        };
      case 'yearly':
        return {
          categories: ['2020', '2021', '2022', '2023', '2024'],
          values: [5800000, 6500000, 7800000, 8900000, 9500000]
        };
      default:
        return {
          categories: [],
          values: []
        };
    }
  }

  private capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}