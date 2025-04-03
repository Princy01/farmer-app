import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sales-trends',
  templateUrl: './sales-trends.component.html',
  styleUrls: ['./sales-trends.component.scss'],
  standalone: true,
  imports: [IonicModule, NgApexchartsModule, FormsModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SalesTrendsComponent implements OnInit {
  selectedView: string = 'trends';
  selectedPeriod: string = 'monthly';
  chartOptions: any;
  topProductsOptions: any;

  ngOnInit() {
    this.initializeCharts();
  }

  onViewChange() {
    if (this.selectedView === 'trends') {
      this.updateTrendsChart();
    } else {
      this.initializeTopProductsChart();
    }
  }

  onPeriodChange() {
    this.updateTrendsChart();
  }

  private initializeCharts() {
    this.updateTrendsChart();
    this.initializeTopProductsChart();
  }

  private updateTrendsChart() {
    const data = this.getDataForPeriod(this.selectedPeriod);
    this.chartOptions = {
      series: [{
        name: 'Sales',
        data: data.values
      }],
      chart: {
        height: 350,
        type: 'line',
        background: '#ffffff',
        toolbar: {
          show: true
        },
        padding: {
          top: 20,
          right: 20,
          bottom: 0,
          left: 0
        }
      },
      colors: ['#2E93fA'],
      xaxis: {
        categories: data.categories
      },
      yaxis: {
        title: {
          text: 'Sales (₹)'
        },
        labels: {
          formatter: (value: number) => `₹${(value/1000).toFixed(0)}K`
        }
      },
      title: {
        text: `${this.selectedPeriod.charAt(0).toUpperCase() + this.selectedPeriod.slice(1)} Sales Trends`,
        align: 'center',
        style: {
          fontSize: '16px'
        },
        margin: 40
      },
      margin: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      }
    };
  }

  private initializeTopProductsChart() {
    const productData = [
      { name: 'Onion (Lasalgaon Mandi)', value: 8500 },
      { name: 'Potato (Agra Mandi)', value: 7200 },
      { name: 'Tomato (Kolar Mandi)', value: 6800 },
      { name: 'Cabbage (Pune Mandi)', value: 5900 },
      { name: 'Cauliflower (Delhi Mandi)', value: 5500 },
      { name: 'Green Peas (Indore Mandi)', value: 4800 },
      { name: 'Carrot (Bangalore Mandi)', value: 4200 },
      { name: 'Bitter Gourd (Chennai Mandi)', value: 3900 },
      { name: 'Lady Finger (Ahmedabad Mandi)', value: 3500 },
      { name: 'Brinjal (Kolkata Mandi)', value: 3200 }
    ];

    this.topProductsOptions = {
      series: [{
        name: 'Sales Volume',
        data: productData.map(item => item.value)
      }],
      chart: {
        type: 'bar',
        height: 500,
        background: '#ffffff',
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          distributed: true,
          dataLabels: {
            position: 'center',
          },
          barHeight: '80%'
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (value: number) => `${value} kg`,
        style: {
          fontSize: '12px',
          colors: ['#ffffff']
        }
      },
      xaxis: {
        categories: productData.map(item => item.name),
        title: {
          text: 'Sales Volume (kg)'
        }
      },
      yaxis: {
        title: {
          text: 'Products & Mandi Location'
        }
      },
      colors: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
        '#FFD93D', '#6C5B7B', '#355C7D', '#F67280', '#2A363B'
      ],
      title: {
        text: 'Top Selling Mandi Products',
        align: 'center',
        style: {
          fontSize: '16px'
        },
        margin: 20
      },
      tooltip: {
        y: {
          formatter: (value: number) => `${value} kg`
        }
      },
      grid: {
        xaxis: {
          lines: {
            show: true
          }
        }
      }
    };
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
}