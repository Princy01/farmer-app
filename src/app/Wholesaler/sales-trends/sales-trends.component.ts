import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule } from '@ionic/angular';
import { register } from 'swiper/element/bundle';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

register();

@Component({
  selector: 'app-sales-trends',
  template: `
    <ion-content>
      <swiper-container [slidesPerView]="1" [pagination]="true">
        <!-- Monthly Sales Chart -->
        <swiper-slide>
          <div class="chart-container">
            <h3>Monthly Sales Trends</h3>
            <apx-chart
              [series]="monthlySalesOptions.series"
              [chart]="monthlySalesOptions.chart"
              [xaxis]="monthlySalesOptions.xaxis"
              [yaxis]="monthlySalesOptions.yaxis"
              [colors]="monthlySalesOptions.colors"
            ></apx-chart>
          </div>
        </swiper-slide>

        <!-- Weekly Sales Chart -->
        <swiper-slide>
          <div class="chart-container">
            <h3>Weekly Sales Comparison</h3>
            <apx-chart
              [series]="weeklySalesOptions.series"
              [chart]="weeklySalesOptions.chart"
              [xaxis]="weeklySalesOptions.xaxis"
              [yaxis]="weeklySalesOptions.yaxis"
              [colors]="weeklySalesOptions.colors"
            ></apx-chart>
          </div>
        </swiper-slide>

        <!-- Top Products Chart -->
        <swiper-slide>
          <div class="chart-container">
            <h3>Top Selling Products</h3>
            <apx-chart
              [series]="topProductsOptions.series"
              [chart]="topProductsOptions.chart"
              [labels]="topProductsOptions.labels"
              [colors]="topProductsOptions.colors"
            ></apx-chart>
          </div>
        </swiper-slide>
      </swiper-container>
    </ion-content>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    swiper-container {
      height: 100%;
    }
    .chart-container {
      width: 100%;
      height: 100%;
      padding: 20px;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h3 {
      color: #333;
      margin-bottom: 20px;
      text-align: center;
    }
  `],
  standalone: true,
  imports: [IonicModule, NgApexchartsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SalesTrendsComponent implements OnInit {
  monthlySalesOptions: any;
  weeklySalesOptions: any;
  topProductsOptions: any;

  ngOnInit() {
    this.initializeCharts();
  }

  private initializeCharts() {
    // Monthly Sales Chart Options
    this.monthlySalesOptions = {
      series: [{
        name: 'Sales',
        data: [320000, 450000, 380000, 540000, 420000, 680000, 720000, 850000, 690000, 920000, 850000, 990000]
      }],
      chart: {
        height: 350,
        type: 'line',
        background: '#ffffff'
      },
      colors: ['#2E93fA'],
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      },
      yaxis: {
        title: {
          text: 'Sales (₹)'
        },
        labels: {
          formatter: (value: number) => `₹${(value/1000).toFixed(0)}K`
        }
      }
    };

    // Weekly Sales Chart Options for Top Products
    this.weeklySalesOptions = {
      series: [{
        name: 'This Week',
        data: [2500, 3200, 2800, 4100, 3600, 2900, 3800]
      }, {
        name: 'Last Week',
        data: [2100, 2800, 2400, 3500, 3200, 2600, 3400]
      }],
      chart: {
        height: 350,
        type: 'bar',
        background: '#ffffff'
      },
      colors: ['purple', 'pink'],
      xaxis: {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      yaxis: {
        title: {
          text: 'Sales (kg)'
        }
      }
    };

    // Top Products Chart Options
    this.topProductsOptions = {
      series: [4800, 3900, 3200, 2800, 2500],
      chart: {
        height: 350,
        type: 'pie',
        background: '#ffffff'
      },
      labels: ['Potato', 'Onion', 'Tomato', 'Cauliflower', 'Green Peas'],
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'],
      tooltip: {
        y: {
          formatter: (value: number) => `${value} kg`
        }
      },
      title: {
        text: 'Weekly Sales Volume by Product',
        align: 'center',
        style: {
          fontSize: '16px'
        }
      }
    };
  }
}