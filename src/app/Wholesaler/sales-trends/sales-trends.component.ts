import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule, NavController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';

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
  chartOptions: any;
  topProductsOptions: any;

  constructor(private navController: NavController) {
    addIcons({ chevronBackOutline });
  }

  ngOnInit() {
    this.initializeCharts();
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
      this.updateTrendsChart();
    } else {
      this.updateTopProductsChart();
    }
  }

  private initializeCharts() {
    this.updateTrendsChart();
    this.updateTopProductsChart();
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
          formatter: (value: number) => `₹${(value / 1000).toFixed(0)}K`
        }
      },
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

  private updateTopProductsChart() {
    const productData = this.getTopProductsForPeriod(this.selectedPeriod);

    this.topProductsOptions = {
      series: [{
        name: 'Sales Volume',
        data: productData.map(item => item.value)
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
        formatter: (value: number) => `${value}`,
        style: {
          fontSize: '7px',
          colors: ['#000']
        }
      },
      xaxis: {
        categories: productData.map(item => item.name),
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
          text: 'Sales Volume (kg)'
        },
        labels: {
          formatter: (value: number) => `${value} kg`
        }
      },
      colors: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
        '#FFD93D', '#6C5B7B', '#355C7D', '#F67280', '#2A363B'
      ],
      title: {
        text: `Top Products - ${this.capitalize(this.selectedPeriod)}`,
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
      }
    };
  }

  private getTopProductsForPeriod(period: string): { name: string, value: number }[] {
    const base = {
      weekly: 1000,
      monthly: 4000,
      quarterly: 12000,
      yearly: 50000
    }[period] || 1000;

    return [
      { name: 'Onion (Lasalgaon Mandi)', value: base + 500 },
      { name: 'Potato (Agra Mandi)', value: base + 300 },
      { name: 'Tomato (Kolar Mandi)', value: base + 200 },
      { name: 'Cabbage (Pune Mandi)', value: base - 100 },
      { name: 'Cauliflower (Delhi Mandi)', value: base - 300 },
      { name: 'Green Peas (Indore Mandi)', value: base - 500 },
      { name: 'Carrot (Bangalore Mandi)', value: base - 800 },
      { name: 'Bitter Gourd (Chennai Mandi)', value: base - 900 },
      { name: 'Lady Finger (Ahmedabad Mandi)', value: base - 1000 },
      { name: 'Brinjal (Kolkata Mandi)', value: base - 1200 }
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
