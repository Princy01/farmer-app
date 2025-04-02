import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule } from '@ionic/angular';
import { register } from 'swiper/element/bundle';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

register();

@Component({
  selector: 'app-market-comparison',
  template: `
    <ion-content>
      <div class="chart-container">
        <h3>Price Comparison Across Markets</h3>
        <apx-chart
          [series]="priceComparisonOptions.series"
          [chart]="priceComparisonOptions.chart"
          [xaxis]="priceComparisonOptions.xaxis"
          [yaxis]="priceComparisonOptions.yaxis"
          [plotOptions]="priceComparisonOptions.plotOptions"
          [colors]="priceComparisonOptions.colors"
          [tooltip]="priceComparisonOptions.tooltip"
        ></apx-chart>
      </div>
    </ion-content>
  `,
  styles: [`
    :host {
      display: block;
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
export class MarketComparisonComponent implements OnInit {
  priceComparisonOptions: any;

  ngOnInit() {
    this.initializeCharts();
  }

  private initializeCharts() {
    this.priceComparisonOptions = {
      series: [{
        name: 'Azadpur Mandi',
        data: [45, 52, 38, 24, 33, 26]
      }, {
        name: 'Ghazipur Mandi',
        data: [42, 48, 35, 22, 31, 24]
      }, {
        name: 'Okhla Mandi',
        data: [48, 55, 42, 28, 36, 29]
      }],
      chart: {
        type: 'bar',
        height: 350,
        stacked: false,
        toolbar: {
          show: false
        }
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
        categories: ['Potato', 'Onion', 'Tomato', 'Cauliflower',
                    'Green Peas', 'Cabbage'],
        title: {
          text: 'Products'
        }
      },
      yaxis: {
        title: {
          text: 'Price (₹/kg)'
        },
        labels: {
          formatter: function(val: number) {
            return '₹' + val;
          }
        }
      },
      tooltip: {
        y: {
          formatter: function(val: number) {
            return '₹' + val + '/kg';
          }
        }
      }
    };
  }
}