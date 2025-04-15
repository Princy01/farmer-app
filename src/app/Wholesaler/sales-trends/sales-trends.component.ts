import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule, NavController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';

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

  onMetricChange() {
    if (this.selectedView === 'products') {
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
          `₹${(value/1000).toFixed(0)}K`,
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
            `₹${(value/1000).toFixed(0)}K`
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