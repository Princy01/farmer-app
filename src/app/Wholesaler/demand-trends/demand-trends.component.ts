import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';  // For charts
import { IonicModule } from '@ionic/angular';
import { register } from 'swiper/element/bundle'; // For carousel
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';  // Allows usage of Swiper Web Components


@Component({
  selector: 'app-demand-trends',
  template: `
    <ion-content>
      <swiper-container [slidesPerView]="1" [pagination]="true">
        <!-- Seasonal Demand Chart -->
        <swiper-slide>
          <div class="chart-container">
            <h3>Seasonal Demand Patterns</h3>
            <apx-chart
              [series]="seasonalDemandOptions.series"
              [chart]="seasonalDemandOptions.chart"
              [xaxis]="seasonalDemandOptions.xaxis"
              [yaxis]="seasonalDemandOptions.yaxis"
              [colors]="seasonalDemandOptions.colors"
            ></apx-chart>
          </div>
        </swiper-slide>

        <!-- Product Demand Comparison -->
        <swiper-slide>
          <div class="chart-container">
            <h3>Product Demand Comparison</h3>
            <apx-chart
              [series]="productDemandOptions.series"
              [chart]="productDemandOptions.chart"
              [xaxis]="productDemandOptions.xaxis"
              [yaxis]="productDemandOptions.yaxis"
              [colors]="productDemandOptions.colors"
              [plotOptions]="productDemandOptions.plotOptions"
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
export class DemandTrendsComponent implements OnInit {
  seasonalDemandOptions: any;
  productDemandOptions: any;

  ngOnInit() {
    this.initializeCharts();
  }

  private initializeCharts() {
    // Seasonal Demand Chart Options
    this.seasonalDemandOptions = {
      series: [{
        name: 'Potato',
        data: [45000, 52000, 38000, 24000, 33000, 26000, 21000, 20000, 40000, 55000, 58000, 56000]
      }, {
        name: 'Tomato',
        data: [35000, 41000, 62000, 42000, 13000, 18000, 29000, 37000, 36000, 51000, 32000, 35000]
      }, {
        name: 'Onion',
        data: [87000, 57000, 74000, 99000, 75000, 38000, 62000, 47000, 82000, 56000, 45000, 47000]
      }],
      chart: {
        height: 350,
        type: 'line',
        background: '#ffffff'
      },
      colors: ['#FF6B6B', '#45B7D1', '#4ECDC4'],
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      },
      yaxis: {
        title: {
          text: 'Demand (kg)'
        },
        labels: {
          formatter: function(val: number) {
            return val.toLocaleString() + ' kg';
          }
        }
      },
      tooltip: {
        y: {
          formatter: function(val: number) {
            return val.toLocaleString() + ' kg';
          }
        }
      }
    };

    // Product Demand Comparison
    this.productDemandOptions = {
      series: [{
        name: 'Current Demand',
        data: [44000, 55000, 57000, 56000, 61000, 58000]
      }, {
        name: 'Previous Month',
        data: [76000, 85000, 101000, 98000, 87000, 105000]
      }],
      chart: {
        type: 'bar',
        height: 350,
        background: '#ffffff'
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded'
        },
      },
      colors: ['#20E647', '#FEB019'],
      xaxis: {
        categories: ['Potato', 'Onion', 'Tomato', 'Cauliflower',
                    'Green Peas', 'Cabbage'],
      },
      yaxis: {
        title: {
          text: 'Demand (kg)'
        },
        labels: {
          formatter: function(val: number) {
            return val.toLocaleString() + ' kg';
          }
        }
      },
      tooltip: {
        y: {
          formatter: function(val: number) {
            return val.toLocaleString() + ' kg';
          }
        }
      }
    };
  }
}